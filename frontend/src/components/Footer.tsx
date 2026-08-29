import React from 'react';
import { HeartHandshake } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto bg-[#FAF8F5] border-t border-[#E5E7EB] text-[#4B5563] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 font-extrabold text-sm text-[#111827]">
            <HeartHandshake className="w-5 h-5 text-[#7567E8]" />
            <span>DonateConnect</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
