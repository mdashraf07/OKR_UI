import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-20 h-20 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-5 text-amber-600 shadow-sm">
        <ShieldAlert className="w-10 h-10" />
      </div>
      <h1 className="text-2xl font-bold text-[#1e293b] mb-2">Access Denied (403)</h1>
      <p className="text-sm text-[#64748b] max-w-md mb-6 leading-relaxed">
        You do not have permission to access this page. This action or module is restricted to higher
        administrative or management roles.
      </p>
      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={() => navigate(-1)}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Go back
        </Button>
        <Button variant="primary" onClick={() => navigate('/dashboard')}>
          Go to my dashboard
        </Button>
      </div>
    </div>
  );
};

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-20 h-20 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center mb-5 text-[#2d8fd8] shadow-sm">
        <span className="text-2xl font-black">404</span>
      </div>
      <h1 className="text-2xl font-bold text-[#1e293b] mb-2">Page Not Found</h1>
      <p className="text-sm text-[#64748b] max-w-md mb-6 leading-relaxed">
        The requested address does not exist or has been moved within the OKR performance portal.
      </p>
      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={() => navigate(-1)}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Go back
        </Button>
        <Button variant="primary" onClick={() => navigate('/dashboard')}>
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};
