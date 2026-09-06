package com.vehicletracker.app;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;

@CapacitorPlugin(name = "ApkInstaller")
public class ApkInstallerPlugin extends Plugin {

    @PluginMethod
    public void validateApk(PluginCall call) {
        String filePath = call.getString("filePath");
        if (filePath == null) {
            call.reject("filePath is required");
            return;
        }

        try {
            File file = resolveFile(filePath);
            if (!file.exists()) {
                call.reject("APK file does not exist at path: " + filePath);
                return;
            }
            if (file.length() < 50000) {
                call.reject("APK is too small (" + file.length() + " bytes) — download is likely corrupt or a JSON error");
                return;
            }
            if (!looksLikeZip(file)) {
                call.reject("File is not a ZIP/APK package (bad magic). Re-download from the server.");
                return;
            }

            Context context = getContext();
            PackageManager pm = context.getPackageManager();
            PackageInfo info;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                info = pm.getPackageArchiveInfo(file.getAbsolutePath(), PackageManager.PackageInfoFlags.of(0));
            } else {
                info = pm.getPackageArchiveInfo(file.getAbsolutePath(), 0);
            }
            if (info == null) {
                call.reject("Android cannot parse this APK — it is corrupt or unsigned. Re-download a valid build.");
                return;
            }

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("packageName", info.packageName != null ? info.packageName : "");
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                ret.put("versionCode", (int) info.getLongVersionCode());
            } else {
                ret.put("versionCode", info.versionCode);
            }
            ret.put("versionName", info.versionName != null ? info.versionName : "");
            ret.put("size", file.length());
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("APK validation failed: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void installApk(PluginCall call) {
        String filePath = call.getString("filePath");
        if (filePath == null) {
            call.reject("filePath is required");
            return;
        }

        try {
            Context context = getContext();
            File file = resolveFile(filePath);

            if (!file.exists()) {
                call.reject("APK file does not exist at path: " + filePath);
                return;
            }

            // Refuse to hand a bad file to the system installer (avoids vague "App not installed").
            if (!looksLikeZip(file) || file.length() < 50000) {
                call.reject("Downloaded APK failed integrity check. Delete it and download again from Settings.");
                return;
            }
            PackageManager pm = context.getPackageManager();
            PackageInfo info;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                info = pm.getPackageArchiveInfo(file.getAbsolutePath(), PackageManager.PackageInfoFlags.of(0));
            } else {
                info = pm.getPackageArchiveInfo(file.getAbsolutePath(), 0);
            }
            if (info == null) {
                call.reject("APK is not installable (Android could not parse the package). Re-download from the server.");
                return;
            }

            Uri apkUri;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                apkUri = FileProvider.getUriForFile(
                    context,
                    context.getPackageName() + ".fileprovider",
                    file
                );
            } else {
                apkUri = Uri.fromFile(file);
            }

            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            context.startActivity(intent);

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Error installing APK: " + e.getMessage(), e);
        }
    }

    private static File resolveFile(String filePath) {
        if (filePath.startsWith("file://")) {
            return new File(Uri.parse(filePath).getPath());
        }
        return new File(filePath);
    }

    private static boolean looksLikeZip(File file) throws IOException {
        try (FileInputStream in = new FileInputStream(file)) {
            byte[] hdr = new byte[4];
            int n = in.read(hdr);
            return n >= 2 && hdr[0] == 'P' && hdr[1] == 'K';
        }
    }
}
