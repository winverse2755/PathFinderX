"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "./ui/button";

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scanner = new Html5Qrcode(containerRef.current.id);
    scannerRef.current = scanner;

    const startScanning = async () => {
      try {
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            onScan(decodedText);
            scanner.stop();
            setIsScanning(false);
          },
          (errorMessage) => {
            // Ignore scanning errors (they're frequent during scanning)
          }
        );
        setIsScanning(true);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to start camera");
        setIsScanning(false);
      }
    };

    startScanning();

    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current?.clear();
          })
          .catch(() => {
            // Ignore cleanup errors
          });
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-celo-purple/90 flex items-center justify-center p-4">
      <div className="bg-white border-4 border-celo-purple p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6 border-b-4 border-celo-purple pb-4">
          <h2 className="text-display text-2xl font-display italic text-celo-purple">Scan QR Code</h2>
          <Button variant="ghost" onClick={onClose} className="border-2 border-celo-purple hover:bg-celo-purple hover:text-celo-yellow">
            ✕
          </Button>
        </div>

        <div id="qr-reader" ref={containerRef} className="w-full mb-6 border-4 border-celo-yellow" />

        {error && (
          <div className="border-4 border-celo-orange bg-celo-orange text-celo-purple mb-4 p-4">
            <p className="text-body-bold">{error}</p>
          </div>
        )}

        {!isScanning && !error && (
          <div className="text-center text-body-bold text-celo-brown mb-6">
            Position the QR code within the frame
          </div>
        )}

        <div className="flex gap-4">
          <Button variant="outline" onClick={onClose} className="flex-1 border-4" size="lg">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

