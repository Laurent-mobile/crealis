package com.crealis.pos;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(Z108PrinterPlugin.class);
        registerPlugin(ZcsDevicePlugin.class);
        super.onCreate(savedInstanceState);
    }
}