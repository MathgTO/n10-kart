/** In-app privacy policy (App Review 5.1.1 requires it inside the app as well as in App Store Connect).
 *  Keep in sync with public/privacy.html. */
export function PrivacyPage() {
  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <p className="text-sm font-bold uppercase text-n10-lime">Privacy</p>
        <h1 className="text-3xl font-black mt-1">N10 privacy policy</h1>
        <p className="mt-1 text-sm text-n10-mute">Effective September 29, 2026</p>
      </div>
      <section className="panel space-y-3 text-base text-n10-soft leading-relaxed">
        <p>
          <span className="font-semibold text-white">Short version: N10 collects no data.</span> Everything
          you import stays on your device.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            Session files (.xrk, .xrz, CSV) and onboard video are read and analyzed on your device. They
            are never uploaded to us or to anyone else.
          </li>
          <li>N10 has no accounts, no sign-in, no analytics, no advertising and no tracking.</li>
          <li>
            Your session library is stored only in the app&apos;s storage on your device. It may be included in
            your own device backup (iCloud or computer) under your Apple account, which we can&apos;t access.
          </li>
          <li>
            Session files other apps hand to N10 (AirDrop, Files, share sheet) are copied into N10&apos;s own
            folder on your device, which you can see and manage in the Files app.
          </li>
          <li>N10 does not use your camera, microphone, location or contacts.</li>
          <li>
            Video you attach is chosen with the system picker. N10 only sees the clip you pick.
          </li>
          <li>
            Children and teens: N10 is used by junior karters and their families. Because N10 collects no
            personal information from anyone, it collects none from minors either.
          </li>
          <li>Deleting a session, or deleting the app, removes its data from your device.</li>
        </ul>
        <p>
          If this policy changes, the new version will be posted in the app and on our website with a new
          effective date. Questions: contact the developer through the support link on the App Store
          listing.
        </p>
      </section>
    </div>
  )
}
