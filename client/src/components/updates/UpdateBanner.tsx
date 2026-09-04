import React from 'react';
import { Download, Sparkles, X, ArrowUpCircle, CheckCircle2 } from 'lucide-react';
import { useUpdate } from '../../context/UpdateContext';

export const UpdateBanner: React.FC = () => {
  const {
    hasUpdate,
    latestRelease,
    isDownloading,
    downloadProgress,
    downloadedUri,
    downloadUpdate,
    installUpdate,
    dismissBanner,
    bannerDismissed,
  } = useUpdate();

  if (!hasUpdate || bannerDismissed || !latestRelease) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white px-4 py-2.5 shadow-lg relative z-40">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-white/20 rounded-full">
            <Sparkles className="w-4 h-4 text-emerald-100" />
          </div>
          <div>
            <span className="font-semibold">New App Update Available:</span>{' '}
            <span className="bg-white/20 px-2 py-0.5 rounded font-mono text-xs">
              v{latestRelease.version}
            </span>
            {latestRelease.release_notes && (
              <span className="text-emerald-100 hidden md:inline ml-2 text-xs">
                — {latestRelease.release_notes}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {isDownloading ? (
            <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full text-xs">
              <div className="w-20 bg-white/30 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-white h-full transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
              <span>{downloadProgress}%</span>
            </div>
          ) : downloadedUri ? (
            <button
              onClick={installUpdate}
              className="flex items-center gap-1.5 bg-white text-emerald-800 font-semibold px-3 py-1 rounded-lg text-xs hover:bg-emerald-50 active:scale-95 transition shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Install Update
            </button>
          ) : (
            <button
              onClick={downloadUpdate}
              className="flex items-center gap-1.5 bg-white text-emerald-800 font-semibold px-3 py-1 rounded-lg text-xs hover:bg-emerald-50 active:scale-95 transition shadow-sm"
            >
              <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-600" />
              Download APK
            </button>
          )}

          <button
            onClick={dismissBanner}
            className="p-1 text-white/80 hover:text-white rounded-md hover:bg-white/10"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
