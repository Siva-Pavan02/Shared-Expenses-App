import { ImportFinalizationService } from '../src/modules/imports/services/import-finalization.service';
import { prisma } from '../src/config/prisma';

jest.mock('../src/config/prisma', () => ({
  prisma: {
    importJob: {
      updateMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  }
}));

describe('ImportFinalizationService Integration Logic', () => {
  const service = new ImportFinalizationService();
  const mockImportJobId = 'test-job-id';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('prevents finalizing a job that is already finalized or finalizing', async () => {
    // Mock updateMany returning 0 count (no rows updated, meaning lock failed)
    (prisma.importJob.updateMany as jest.Mock).mockResolvedValue({ count: 0 });
    
    // Mock findUnique returning a job that is already COMPLETED
    (prisma.importJob.findUnique as jest.Mock).mockResolvedValue({ status: 'COMPLETED' });

    await expect(service.finalizeImport(mockImportJobId, 'some-user-id'))
      .rejects.toThrow(/Import Job cannot be finalized. Current status: COMPLETED/);
      
    // Assert that transaction was never called
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rolls back completely if a row throws an error in the transaction', async () => {
    // Mock updateMany successfully taking the lock
    (prisma.importJob.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

    // Mock transaction throwing an error
    (prisma.$transaction as jest.Mock).mockRejectedValue(new Error('Simulated DB Failure inside transaction'));

    await expect(service.finalizeImport(mockImportJobId, 'some-user-id'))
      .rejects.toThrow(/Import finalization failed and rolled back safely: Simulated DB Failure inside transaction/);

    // Assert that the job status was updated to FAILED in the catch block
    expect(prisma.importJob.update).toHaveBeenCalledWith({
      where: { id: mockImportJobId },
      data: { status: 'FAILED' }
    });
  });

  it('calling finalize twice concurrently must not create duplicate ledgers', async () => {
    // We simulate a race condition where two requests hit finalize at the exact same time.
    // updateMany is atomic in postgres. First call gets count: 1, second gets count: 0.
    (prisma.importJob.updateMany as jest.Mock)
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });

    (prisma.importJob.findUnique as jest.Mock).mockResolvedValue({ status: 'FINALIZING' });

    // We can simulate the transaction succeeding for the first call
    (prisma.$transaction as jest.Mock).mockResolvedValueOnce({ status: 'COMPLETED', createdExpenses: 5 });

    const p1 = service.finalizeImport(mockImportJobId, 'user-1');
    const p2 = service.finalizeImport(mockImportJobId, 'user-2');

    // Wait for both
    const results = await Promise.allSettled([p1, p2]);

    expect(results[0].status).toBe('fulfilled');
    expect(results[1].status).toBe('rejected');

    if (results[1].status === 'rejected') {
      expect(results[1].reason.message).toMatch(/Import Job cannot be finalized/);
    }

    // The transaction should only have been called ONCE.
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
