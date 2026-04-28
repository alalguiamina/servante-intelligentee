import React from 'react';
import RealtimeDetection from './RealtimeDetection';

interface ProductValidationProps {
  toolName: string;
  borrowId: string;
  drawerId?: string;
  action?: 'borrow' | 'return';
  isRetry?: boolean;
  initialSnapshot?: any[]; // Detection[] from DrawerOpeningGuard
  onValidationSuccess: () => void;
  onValidationFailure: (reason: string) => void;
  onRetry?: () => void;
  onBorrowAlternative?: (wrongToolName: string) => void;
  onExtraToolsDetected?: (extraToolNames: string[]) => void;
  onBorrowStolenTools?: (toolNames: string[]) => Promise<void>;
  onSkip?: () => void;
}

const ProductValidation: React.FC<ProductValidationProps> = ({
  toolName,
  borrowId,
  drawerId,
  action = 'borrow',
  isRetry = false,
  initialSnapshot,
  onValidationSuccess,
  onValidationFailure,
  onRetry,
  onBorrowAlternative,
  onExtraToolsDetected,
  onBorrowStolenTools,
}) => {
  return (
    <RealtimeDetection
      toolName={toolName}
      borrowId={borrowId}
      drawerId={drawerId}
      action={action}
      isRetry={isRetry}
      initialSnapshot={initialSnapshot}
      onDetectionSuccess={onValidationSuccess}
      onDetectionFailure={onValidationFailure}
      onRetry={onRetry ?? (() => onValidationFailure("Détection annulée — réessayez depuis la sélection d'outil."))}
      onBorrowAlternative={onBorrowAlternative}
      onExtraToolsDetected={onExtraToolsDetected}
      onBorrowStolenTools={onBorrowStolenTools}
    />
  );
};

export default ProductValidation;
