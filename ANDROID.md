# تحديث تطبيق أندرويد على Google Play (المرحلة 5)

الشِل الأصلي يستخدم Capacitor ويحمّل الموقع المنشور مباشرة (وضع hybrid)، فتصل
التحديثات للمستخدمين فورًا بدون رفع نسخة جديدة، بينما يبقى Google Play Billing
متاحًا داخل التطبيق.

## 1. الإعداد لمرة واحدة (على جهازك)

```bash
git clone <مستودع-المشروع> && cd <المشروع>
bun install
bunx cap add android
```

قبل ذلك: افتح `capacitor.config.ts` وغيّر

- `appId` إلى نفس `applicationId` الموجود حاليًا في Play Console (مهم جدًا، وإلا سيُعتبر تطبيقًا جديدًا).
- `server.url` إلى نطاق الإنتاج الخاص بك.

## 2. إضافة Google Play Billing

```bash
bun add @capgo/capacitor-purchases   # أو أي إضافة billing تفضّلها
bunx cap sync android
```

الكود جاهز بالفعل: `src/lib/native-billing.ts` يبحث عن
`Capacitor.Plugins.InAppPurchase` أو `Purchases`، ويسلّم الإيصال للخادم
الذي يتحقق منه عبر Google Play Developer API قبل منح أي صلاحية.

## 3. منتجات Play Console

اشتراكات: `pro_monthly`، `pro_yearly`
منتجات لمرة واحدة: `lifetime`، `path_intermediate`، `path_upper_intermediate`، `path_advanced`

المعرفات يجب أن تطابق `src/lib/products.ts` حرفيًا.

## 4. الأسرار المطلوبة على الخادم

| المفتاح | المصدر |
| --- | --- |
| `PLAY_SERVICE_ACCOUNT_JSON` | حساب خدمة من Google Cloud بصلاحية Android Publisher |
| `PLAY_PACKAGE_NAME` | اسم حزمة التطبيق |
| `PLAY_RTDN_SECRET` | قيمة سرّية تضعها في رابط إشعارات Play |

رابط الإشعارات اللحظية (RTDN): `https://<نطاقك>/api/public/play-rtdn?secret=<PLAY_RTDN_SECRET>`

## 5. البناء والرفع

```bash
bun run build
bunx cap sync android
bunx cap open android
```

في Android Studio: ارفع `versionCode`، ثم Build → Generate Signed Bundle (`.aab`)
بنفس مفتاح التوقيع الحالي. ارفعه في Play Console عبر
Internal testing → Closed testing → Production.