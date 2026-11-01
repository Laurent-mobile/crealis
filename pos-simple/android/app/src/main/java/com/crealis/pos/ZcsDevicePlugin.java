package com.crealis.pos;

import android.app.Presentation;
import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.media.MediaRouter;
import android.os.Bundle;
import android.util.Log;
import android.view.Display;
import android.view.Gravity;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ZcsDevice")
public class ZcsDevicePlugin extends Plugin {

    private static final String TAG = "ZcsDevice";
    private CustomerPresentation presentation;
    private Display customerDisplay;

    @Override
    public void load() {
        Log.d(TAG, "🔧 ZcsDevice load()");
        findCustomerDisplay();
    }

    private void findCustomerDisplay() {
        try {
            MediaRouter mediaRouter = (MediaRouter) getContext().getSystemService(Context.MEDIA_ROUTER_SERVICE);
            MediaRouter.RouteInfo route = mediaRouter.getSelectedRoute(MediaRouter.ROUTE_TYPE_LIVE_VIDEO);
            if (route != null) {
                customerDisplay = route.getPresentationDisplay();
                if (customerDisplay != null) {
                    Log.d(TAG, "✅ Écran client: ID=" + customerDisplay.getDisplayId());
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "❌ Erreur: " + e.getMessage());
        }
    }

    @PluginMethod
    public void showOnLcd(PluginCall call) {
        String text = call.getString("text", "");
        if (customerDisplay == null) findCustomerDisplay();
        if (customerDisplay == null) { call.reject("Aucun écran client"); return; }

        final String finalText = text;
        getActivity().runOnUiThread(() -> {
            if (presentation != null) presentation.dismiss();
            presentation = new CustomerPresentation(getContext(), customerDisplay, finalText);
            presentation.show();
        });
        call.resolve();
    }

    @PluginMethod
    public void clearLcd(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (presentation != null) {
                presentation.dismiss();
                presentation = null;
            }
        });
        call.resolve();
    }

    @Override
    protected void handleOnDestroy() {
        if (presentation != null) presentation.dismiss();
        super.handleOnDestroy();
    }

    // ========== PRÉSENTATION CLIENT AMÉLIORÉE ==========
    private static class CustomerPresentation extends Presentation {
        private String text;

        public CustomerPresentation(Context context, Display display, String text) {
            super(context, display);
            this.text = text;
        }

        @Override
        protected void onCreate(Bundle savedInstanceState) {
            super.onCreate(savedInstanceState);

            LinearLayout mainLayout = new LinearLayout(getContext());
            mainLayout.setOrientation(LinearLayout.VERTICAL);
            mainLayout.setBackgroundColor(Color.parseColor("#0f172a"));
            mainLayout.setPadding(20, 25, 20, 25);

            String[] lines = text.split("\n");

            // Parcourir les lignes
            for (int i = 0; i < lines.length; i++) {
                String line = lines[i].trim();
                if (line.isEmpty()) continue;

                if (line.startsWith("===ENTETE===")) {
                    // En-tête du magasin
                    String name = line.replace("===ENTETE===", "").trim();
                    TextView tv = new TextView(getContext());
                    tv.setText("🏪 " + name);
                    tv.setTextColor(Color.parseColor("#10b981"));
                    tv.setTextSize(22);
                    tv.setTypeface(Typeface.DEFAULT_BOLD);
                    tv.setGravity(Gravity.CENTER);
                    tv.setPadding(0, 0, 0, 5);
                    mainLayout.addView(tv);

                    // Ligne séparatrice
                    View separator = new View(getContext());
                    separator.setLayoutParams(new LinearLayout.LayoutParams(
                            LinearLayout.LayoutParams.MATCH_PARENT, 2));
                    separator.setBackgroundColor(Color.parseColor("#334155"));
                    mainLayout.addView(separator);
                }
                else if (line.startsWith("===TOTAL===")) {
                    // Total
                    String total = line.replace("===TOTAL===", "").trim();

                    View separator = new View(getContext());
                    separator.setLayoutParams(new LinearLayout.LayoutParams(
                            LinearLayout.LayoutParams.MATCH_PARENT, 2));
                    separator.setBackgroundColor(Color.parseColor("#334155"));
                    mainLayout.addView(separator);

                    TextView tvLabel = new TextView(getContext());
                    tvLabel.setText("💰 TOTAL À PAYER");
                    tvLabel.setTextColor(Color.parseColor("#94a3b8"));
                    tvLabel.setTextSize(13);
                    tvLabel.setPadding(0, 10, 0, 0);
                    mainLayout.addView(tvLabel);

                    TextView tvTotal = new TextView(getContext());
                    tvTotal.setText(total);
                    tvTotal.setTextColor(Color.parseColor("#10b981"));
                    tvTotal.setTextSize(36);
                    tvTotal.setTypeface(Typeface.DEFAULT_BOLD);
                    tvTotal.setPadding(0, 0, 0, 10);
                    mainLayout.addView(tvTotal);
                }
                else if (line.startsWith("===NB===")) {
                    // Nombre d'articles
                    String nb = line.replace("===NB===", "").trim();
                    TextView tv = new TextView(getContext());
                    tv.setText("📦 " + nb);
                    tv.setTextColor(Color.parseColor("#94a3b8"));
                    tv.setTextSize(13);
                    tv.setPadding(0, 0, 0, 5);
                    mainLayout.addView(tv);
                }
                else if (line.startsWith("===HEURE===")) {
                    // Heure
                    String heure = line.replace("===HEURE===", "").trim();
                    TextView tv = new TextView(getContext());
                    tv.setText("🕐 " + heure);
                    tv.setTextColor(Color.parseColor("#64748b"));
                    tv.setTextSize(12);
                    tv.setGravity(Gravity.CENTER);
                    tv.setPadding(0, 15, 0, 0);
                    mainLayout.addView(tv);
                }
                else if (line.startsWith("===MERCI===")) {
                    // Message de remerciement
                    TextView tv = new TextView(getContext());
                    tv.setText("Merci de votre visite !");
                    tv.setTextColor(Color.parseColor("#10b981"));
                    tv.setTextSize(14);
                    tv.setGravity(Gravity.CENTER);
                    tv.setPadding(0, 15, 0, 0);
                    mainLayout.addView(tv);
                }
                else {
                    // Article du panier
                    // Format attendu: "Nom produit|Qté|Prix"
                    String[] parts = line.split("\\|");

                    LinearLayout itemLayout = new LinearLayout(getContext());
                    itemLayout.setOrientation(LinearLayout.VERTICAL);
                    itemLayout.setPadding(5, 8, 5, 8);
                    itemLayout.setBackgroundColor(Color.parseColor("#1e293b"));
                    itemLayout.setLayoutParams(new LinearLayout.LayoutParams(
                            LinearLayout.LayoutParams.MATCH_PARENT,
                            LinearLayout.LayoutParams.WRAP_CONTENT));
                    ((LinearLayout.LayoutParams) itemLayout.getLayoutParams()).setMargins(0, 3, 0, 3);

                    if (parts.length >= 1) {
                        TextView nameView = new TextView(getContext());
                        nameView.setText(parts[0].trim());
                        nameView.setTextColor(Color.WHITE);
                        nameView.setTextSize(15);
                        nameView.setTypeface(Typeface.DEFAULT_BOLD);
                        itemLayout.addView(nameView);
                    }

                    if (parts.length >= 3) {
                        LinearLayout detailLayout = new LinearLayout(getContext());
                        detailLayout.setOrientation(LinearLayout.HORIZONTAL);

                        TextView qtyView = new TextView(getContext());
                        qtyView.setText("×" + parts[1].trim() + "  ");
                        qtyView.setTextColor(Color.parseColor("#94a3b8"));
                        qtyView.setTextSize(13);

                        TextView priceView = new TextView(getContext());
                        priceView.setText(parts[2].trim() + " FCFA");
                        priceView.setTextColor(Color.parseColor("#fbbf24"));
                        priceView.setTextSize(13);
                        priceView.setTypeface(Typeface.DEFAULT_BOLD);

                        detailLayout.addView(qtyView);
                        detailLayout.addView(priceView);
                        itemLayout.addView(detailLayout);
                    }

                    mainLayout.addView(itemLayout);
                }
            }

            setContentView(mainLayout);
        }
    }

    // Helper pour créer une View séparatrice (utilisé dans CustomerPresentation)
    private static class View extends android.view.View {
        public View(Context context) {
            super(context);
        }
    }
}
