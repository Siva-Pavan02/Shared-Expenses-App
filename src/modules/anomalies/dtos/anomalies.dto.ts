export interface ReviewAnomalyDto {
  action: 'APPROVE' | 'REJECT';
  resolutionAction?: any; // The chosen fix
}
