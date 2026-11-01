package com.crealis.zcsprinter;

import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// SDK ZCS
import com.zcs.sdk.Printer;
import com.zcs.sdk.print.PrnStrFormat;
import com.zcs.sdk.print.PrnTextFont;
import com.zcs.sdk.print.PrnTextStyle;

@CapacitorPlugin(name = "ZcsPrinter")
public class ZcsPrinterPlugin extends Plugin {

    private static final String TAG = "ZcsPrinter";
    private Printer printer;

    @PluginMethod
    public void init(PluginCall call) {
        try {
            printer = new Printer();

            int status = printer.getPrinterStatus();
            Log.d(TAG, "Printer status: " + status);

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("status", status);
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Init error: " + e.getMessage());
            call.reject("Init failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void printText(PluginCall call) {
        String text = call.getString("text", "");

        try {
            if (printer == null) {
                call.reject("Printer not initialized");
                return;
            }

            PrnStrFormat format = new PrnStrFormat();
            format.setFont(PrnTextFont.MONOSPACE);
            format.setStyle(PrnTextStyle.NORMAL);
            format.setTextSize(20);

            printer.setPrintAppendString(text, format);
            printer.setPrintStart();

            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Print error: " + e.getMessage());
            call.reject("Print failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void printLine(PluginCall call) {
        int count = call.getInt("count", 1);

        try {
            if (printer == null) {
                call.reject("Printer not initialized");
                return;
            }

            StringBuilder line = new StringBuilder();
            for (int i = 0; i < 32; i++) {
                line.append("-");
            }

            PrnStrFormat format = new PrnStrFormat();
            format.setFont(PrnTextFont.DEFAULT);
            format.setTextSize(20);

            for (int i = 0; i < count; i++) {
                printer.setPrintAppendString(line.toString() + "\n", format);
            }
            printer.setPrintStart();

            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "PrintLine error: " + e.getMessage());
            call.reject("PrintLine failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void cutPaper(PluginCall call) {
        try {
            if (printer == null) {
                call.reject("Printer not initialized");
                return;
            }
            printer.setPrintStart();

            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Cut error: " + e.getMessage());
            call.reject("Cut failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        try {
            if (printer == null) {
                call.reject("Printer not initialized");
                return;
            }

            int status = printer.getPrinterStatus();
            String statusStr;
            switch (status) {
                case 0:
                    statusStr = "READY";
                    break;
                case 1:
                    statusStr = "NO_PAPER";
                    break;
                case 2:
                    statusStr = "OVERHEAT";
                    break;
                default:
                    statusStr = "UNKNOWN_" + status;
            }

            JSObject result = new JSObject();
            result.put("status", statusStr);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("GetStatus failed: " + e.getMessage());
        }
    }
}