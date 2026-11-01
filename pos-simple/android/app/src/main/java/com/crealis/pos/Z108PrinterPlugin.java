package com.crealis.pos;

import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.zcs.sdk.DriverManager;
import com.zcs.sdk.Sys;
import com.zcs.sdk.SdkResult;
import com.zcs.sdk.Printer;

import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "Z108Printer")
public class Z108PrinterPlugin extends Plugin {

    private static final String TAG = "Z108Printer";
    private DriverManager driverManager;
    private Sys sys;
    private Printer printer;
    private boolean isInitialized = false;

    @PluginMethod
    public void init(PluginCall call) {
        try {
            Log.d(TAG, "Init imprimante...");
            driverManager = DriverManager.getInstance();
            sys = driverManager.getBaseSysDevice();

            int status = sys.sdkInit();
            Log.d(TAG, "sdkInit: " + status);

            if (status != SdkResult.SDK_OK) {
                sys.sysPowerOn();
                Thread.sleep(1000);
                status = sys.sdkInit();
                Log.d(TAG, "sdkInit retry: " + status);
            }

            if (status == SdkResult.SDK_OK) {
                printer = driverManager.getPrinter();
                isInitialized = true;
                Log.d(TAG, "✅ Imprimante prête");
                call.resolve();
            } else {
                Log.e(TAG, "Échec init: " + status);
                call.reject("Init failed: " + status);
            }
        } catch (Exception e) {
            Log.e(TAG, "Exception init: " + e.getMessage());
            call.reject(e.getMessage());
        }
    }

    @PluginMethod
    public void printReceipt(PluginCall call) {
        if (!isInitialized || printer == null) {
            call.reject("Imprimante non initialisée");
            return;
        }

        try {
            String receiptText = call.getString("receipt");
            if (receiptText == null || receiptText.isEmpty()) {
                call.reject("Ticket vide");
                return;
            }

            Log.d(TAG, "Début impression...");

            // Remplacer les caractères problématiques
            receiptText = receiptText
                .replace("€", "EUR")
                .replace("é", "e")
                .replace("è", "e")
                .replace("ê", "e")
                .replace("à", "a")
                .replace("ù", "u")
                .replace("ô", "o")
                .replace("î", "i")
                .replace("â", "a")
                .replace("ç", "c")
                .replace("É", "E")
                .replace("È", "E")
                .replace("À", "A")
                .replace("Ç", "C");

            String[] lines = receiptText.split("\\n");
            for (String line : lines) {
                if (line != null && !line.isEmpty()) {
                    byte[] bytes = line.getBytes(StandardCharsets.UTF_8);
                    int result = printer.setPrintString(bytes);
                    printer.setPrintLine(1);
                }
            }

            printer.setPrintLine(3);
            Log.d(TAG, "✅ Impression terminée");
            call.resolve();
        } catch (Exception e) {
            Log.e(TAG, "Erreur impression: " + e.getMessage());
            call.reject(e.getMessage());
        }
    }
}