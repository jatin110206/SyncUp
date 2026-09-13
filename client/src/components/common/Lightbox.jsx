import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUiStore } from '../../store/useUiStore';
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';

export const Lightbox = () => {
  const { lightboxImage, setLightboxImage } = useUiStore();
  const [zoom, setZoom] = useState(1);

  if (!lightboxImage) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.5, 1));

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = lightboxImage;
    link.download = `syncup_image_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
        {/* Controls Overlay */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 1}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-50 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            onClick={handleZoomIn}
            disabled={zoom >= 3}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-50 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Download Image"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setLightboxImage(null);
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/80 text-white transition-colors ml-2"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: zoom }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="max-w-4xl max-h-[85vh] overflow-hidden flex items-center justify-center p-2"
        >
          <img
            src={lightboxImage}
            alt="Enlarged shared media"
            className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
