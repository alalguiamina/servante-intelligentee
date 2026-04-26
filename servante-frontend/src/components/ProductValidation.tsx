import React from 'react';
import RealtimeDetection from './RealtimeDetection';

interface ProductValidationProps {
  toolName: string;
  borrowId: string;
  drawerId?: string;
  action?: 'borrow' | 'return';
  onValidationSuccess: () => void;
  onValidationFailure: (reason: string) => void;
  onRetry?: () => void;
  onSkip?: () => void;
}

const ProductValidation: React.FC<ProductValidationProps> = ({
  toolName,
  borrowId,
  drawerId,
  action = 'borrow',
  onValidationSuccess,
  onValidationFailure,
  onRetry,
}) => {
  return (
    <RealtimeDetection
      toolName={toolName}
      borrowId={borrowId}
      drawerId={drawerId}
      action={action}
      onDetectionSuccess={onValidationSuccess}
      onDetectionFailure={onValidationFailure}
      onRetry={onRetry ?? (() => onValidationFailure('Détection annulée — réessayez depuis la sélection d\'outil.'))}
    />
  );
};

export default ProductValidation;
