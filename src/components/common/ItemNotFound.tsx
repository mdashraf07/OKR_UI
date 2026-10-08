import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, ArrowLeft, Home } from 'lucide-react';
import { Button } from '../ui/Button';

interface ItemNotFoundProps {
  title?: string;
  message?: string;
  backTo?: string;
  backLabel?: string;
}

export const ItemNotFound: React.FC<ItemNotFoundProps> = ({
  title = 'Resource Not Found',
  message = 'The requested item does not exist or may have been archived or removed.',
  backTo = '/dashboard',
  backLabel = 'Go Back',
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4 shadow-sm">
        <HelpCircle className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-[#1e293b] mb-2">{title}</h2>
      <p className="text-xs text-[#64748b] max-w-md mb-6 leading-relaxed">
        {message}
      </p>
      <div className="flex items-center gap-3">
        {backTo ? (
          <Button
            variant="secondary"
            onClick={() => navigate(backTo)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            {backLabel}
          </Button>
        ) : (
          <Button
            variant="secondary"
            onClick={() => navigate(-1)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            {backLabel}
          </Button>
        )}
        <Button
          variant="primary"
          onClick={() => navigate('/dashboard')}
          leftIcon={<Home className="w-4 h-4" />}
        >
          Dashboard
        </Button>
      </div>
    </div>
  );
};
