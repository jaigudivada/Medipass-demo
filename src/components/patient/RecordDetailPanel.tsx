import React from 'react';
import { MedicalRecordDoc } from '../../lib/firestore';
import { Dialog } from '../ui/Dialog';
import { Badge } from '../ui/Badge';
import { EmbeddedDocumentViewer } from './EmbeddedDocumentViewer';

export interface RecordDetailPanelProps {
  record: MedicalRecordDoc | null;
  onClose: () => void;
}

export const RecordDetailPanel: React.FC<RecordDetailPanelProps> = ({ record, onClose }) => {
  if (!record) return null;

  return (
    <Dialog
      isOpen={!!record}
      onClose={onClose}
      title={record.type ? record.type.replace('_', ' ').toUpperCase() : 'Medical Record Details'}
      description={`${record.hospitalName || 'Clinical Record'} (${record.date ? new Date(record.date).toLocaleDateString() : ''})`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        <EmbeddedDocumentViewer
          primaryUrl={record.sourceFileUrl || (record as any).documentUrl}
          attachments={record.attachments}
          aiExplanation={typeof record.aiExplanation === 'object' ? record.aiExplanation : { summary: record.aiExplanation }}
          hospitalName={record.hospitalName}
          docTypeLabel={record.type}
        />
      </div>
    </Dialog>
  );
};

