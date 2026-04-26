import React from 'react';
import RealtimeDetection from './RealtimeDetection';

interface ProductValidationProps {
  toolName: string;
  borrowId: string;
  drawerId?: string;
  action?: 'borrow' | 'return';
  isRetry?: boolean;
  onValidationSuccess: () => void;
  onValidationFailure: (reason: string) => void;
  onRetry?: () => void;
  onBorrowAlternative?: (wrongToolName: string) => void;
  onSkip?: () => void;
}

const ProductValidation: React.FC<ProductValidationProps> = ({
  toolName,
  borrowId,
  drawerId,
  action = 'borrow',
  isRetry = false,
  onValidationSuccess,
  onValidationFailure,
  onRetry,
  onBorrowAlternative,
}) => {
  return (
    <RealtimeDetection
      toolName={toolName}
      borrowId={borrowId}
      drawerId={drawerId}
      action={action}
      isRetry={isRetry}
      onDetectionSuccess={onValidationSuccess}
      onDetectionFailure={onValidationFailure}
      onRetry={onRetry ?? (() => onValidationFailure("Détection annulée — réessayez depuis la sélection d'outil."))}
      onBorrowAlternative={onBorrowAlternative}
    />
  );
};

export default ProductValidation;
