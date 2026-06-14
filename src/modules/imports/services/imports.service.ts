import { ImportRepository } from '../repositories/imports.repository';
import { CsvParserService } from './csv-parser.service';
import { MembershipRepository } from '../../memberships/repositories/memberships.repository';

export class ImportService {
  private importRepo = new ImportRepository();
  private csvParser = new CsvParserService();
  private membershipRepo = new MembershipRepository();

  async processCsvUpload(groupId: string, file: Express.Multer.File, requesterId: string) {
    // 1. Validate requester is group member
    const membership = await this.membershipRepo.findMembership(groupId, requesterId);
    if (!membership || !membership.isAdmin) {
      throw new Error('Forbidden: Only group admins can import data');
    }

    // 2. Create the Import Job record
    const importJob = await this.importRepo.createImportJob(groupId, file.originalname);

    // 3. Parse and normalize the CSV
    const parsedRows = this.csvParser.parseCsv(file.buffer);

    // 4. Store the raw and normalized rows
    await this.importRepo.storeImportRows(importJob.id, parsedRows);

    return {
      importJobId: importJob.id,
      totalRows: parsedRows.length,
      rowsParsed: parsedRows.length,
      status: importJob.status
    };
  }

  async getImportJob(id: string) {
    const job = await this.importRepo.getImportJob(id);
    if (!job) throw new Error('Import Job not found');
    return job;
  }

  async listGroupImports(groupId: string, requesterId: string) {
    const membership = await this.membershipRepo.findMembership(groupId, requesterId);
    if (!membership) throw new Error('Forbidden: You must be a member of the group');

    return this.importRepo.listGroupImports(groupId);
  }
}
