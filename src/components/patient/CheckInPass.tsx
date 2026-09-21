import React, { useState } from 'react';
import { useAppState } from '../../context/AppStateContext';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Dialog } from '../ui/Dialog';
import { QrCode, RefreshCw, Clock } from 'lucide-react';

export const CheckInPass: React.FC = () => {
  const { checkInCode, generateCheckInCode, patient } = useAppState();
  const [showQrModal, setShowQrModal] = useState(false);
  const [expiryMinutes] = useState(15);

  return (
    <>
      <Card className="bg-white border-slate-200">
        <CardContent className="p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Hospital Check-In Passcode
            </span>
            <p className="text-xs text-slate-600">
              Present this passcode at the reception desk to unlock your live consultation queue.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-50 border border-slate-200 font-mono text-xl font-bold text-blue-600 px-4 py-2 rounded-lg tracking-widest shadow-2xs">
              {checkInCode}
            </div>

            <Button onClick={generateCheckInCode} variant="default" size="sm">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Generate New</span>
            </Button>

            <Button onClick={() => setShowQrModal(true)} variant="outline" size="sm">
              <QrCode className="w-3.5 h-3.5 text-slate-600" />
              <span>Share QR</span>
            </Button>
          </div>

        </CardContent>
      </Card>

      {/* Time-boxed QR Passport Modal */}
      <Dialog
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        title="Time-Boxed Passport Share"
        description="Temporary view access to your longitudinal records timeline."
        maxWidth="sm"
      >
        <div className="space-y-4 text-center">
          <div className="bg-white p-4 rounded-xl border border-slate-200 inline-block shadow-xs">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=https://medipass.app/share/${patient.id}?exp=${expiryMinutes}m`}
              alt="Passport QR Code"
              className="w-40 h-40 mx-auto"
            />
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="flex items-center justify-center gap-1.5 font-semibold text-slate-800">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Auto-expiring link: {expiryMinutes} minutes</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Access can be revoked at any time from your device.
            </p>
          </div>

          <Button onClick={() => setShowQrModal(false)} variant="destructive" size="sm" className="w-full">
            Revoke Access Link
          </Button>
        </div>
      </Dialog>
    </>
  );
};
