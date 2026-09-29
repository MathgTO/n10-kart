"""Apply N10's App Store settings to the Capacitor-generated ios/ project (idempotent).

Run after `npx cap add ios --packagemanager SPM` (or any time):  python3 scripts/ios_customize.py
Then:  python3 scripts/gen_ios_assets.py   (icons + splash)

- Info.plist: display name, document types / imported UTTypes (.xrk/.xrz/CSV), Files app access,
  export compliance, dark UI, orientations, no camera/location/photos purpose strings.
- project.pbxproj: iOS 16 deployment target, 1.0.0 (1), iPad-only device family, PrivacyInfo.xcprivacy.
- SceneDelegate.swift: stage incoming documents (see ios-native/N10DocumentImport.swift.txt).
"""
import plistlib
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "ios/App/App"
PBX = ROOT / "ios/App/App.xcodeproj/project.pbxproj"
NATIVE = ROOT / "ios-native"

# ---- Decisions (see APPSTORE_SUBMISSION_CHECKLIST.md) ----
DISPLAY_NAME = "N10"
MARKETING_VERSION = "1.0.0"
BUILD_NUMBER = "1"
DEPLOYMENT_TARGET = "16.0"
DEVICE_FAMILY = "2"  # 2 = iPad only (runs on Apple Silicon Macs as "Designed for iPad"); "1,2" = universal
UTI_PREFIX = "com.mathieugamache.n10"  # imported-type identifiers (our namespace, no AiM trademark)


def info_plist():
    p = APP / "Info.plist"
    d = plistlib.load(open(p, "rb"))
    d["CFBundleDisplayName"] = DISPLAY_NAME
    d["CFBundleName"] = DISPLAY_NAME
    d["LSApplicationCategoryType"] = "public.app-category.sports"
    d["UIRequiredDeviceCapabilities"] = ["arm64"]
    d["UIUserInterfaceStyle"] = "Dark"
    # Keep multitasking (Split View / Stage Manager / iPadOS windows). The web UI is responsive.
    d["UIRequiresFullScreen"] = False
    d["ITSAppUsesNonExemptEncryption"] = False
    d["LSSupportsOpeningDocumentsInPlace"] = True
    d["UIFileSharingEnabled"] = True
    d["UISupportedInterfaceOrientations"] = [
        "UIInterfaceOrientationPortrait",
        "UIInterfaceOrientationLandscapeLeft",
        "UIInterfaceOrientationLandscapeRight",
    ]
    d["UISupportedInterfaceOrientations~ipad"] = [
        "UIInterfaceOrientationPortrait",
        "UIInterfaceOrientationPortraitUpsideDown",
        "UIInterfaceOrientationLandscapeLeft",
        "UIInterfaceOrientationLandscapeRight",
    ]
    xrk, xrz = f"{UTI_PREFIX}.xrk", f"{UTI_PREFIX}.xrz"
    d["UTImportedTypeDeclarations"] = [
        {
            "UTTypeIdentifier": xrk,
            "UTTypeDescription": "Kart data logger session (.xrk)",
            "UTTypeConformsTo": ["public.data"],
            "UTTypeTagSpecification": {"public.filename-extension": ["xrk"]},
        },
        {
            "UTTypeIdentifier": xrz,
            "UTTypeDescription": "Kart data logger session, compressed (.xrz)",
            "UTTypeConformsTo": ["public.data"],
            "UTTypeTagSpecification": {"public.filename-extension": ["xrz"]},
        },
    ]
    d["CFBundleDocumentTypes"] = [
        {
            "CFBundleTypeName": "Kart data logger session",
            "CFBundleTypeRole": "Viewer",
            "LSHandlerRank": "Default",
            "LSItemContentTypes": [xrk, xrz],
        },
        {
            "CFBundleTypeName": "Lap / telemetry CSV",
            "CFBundleTypeRole": "Viewer",
            "LSHandlerRank": "Alternate",
            "LSItemContentTypes": ["public.comma-separated-values-text"],
        },
    ]
    for k in [
        "NSCameraUsageDescription",
        "NSMicrophoneUsageDescription",
        "NSLocationWhenInUseUsageDescription",
        "NSLocationAlwaysAndWhenInUseUsageDescription",
        "NSPhotoLibraryUsageDescription",  # PHPicker / <input type=file> need no Photos permission
        "NSPhotoLibraryAddUsageDescription",
    ]:
        d.pop(k, None)
    plistlib.dump(d, open(p, "wb"), sort_keys=True)


FR = "A10A10A10A10A10A10A10001"
BF = "A10A10A10A10A10A10A10002"


def pbxproj():
    s = PBX.read_text()
    s = re.sub(r"IPHONEOS_DEPLOYMENT_TARGET = [0-9.]+;", f"IPHONEOS_DEPLOYMENT_TARGET = {DEPLOYMENT_TARGET};", s)
    s = re.sub(r"MARKETING_VERSION = [0-9.]+;", f"MARKETING_VERSION = {MARKETING_VERSION};", s)
    s = re.sub(r"CURRENT_PROJECT_VERSION = [0-9.]+;", f"CURRENT_PROJECT_VERSION = {BUILD_NUMBER};", s)
    fam = DEVICE_FAMILY if "," not in DEVICE_FAMILY else f'"{DEVICE_FAMILY}"'
    s = re.sub(r'TARGETED_DEVICE_FAMILY = ("?[0-9,]+"?);', f"TARGETED_DEVICE_FAMILY = {fam};", s)
    if FR not in s:
        s = s.replace(
            "/* End PBXBuildFile section */",
            f"\t\t{BF} /* PrivacyInfo.xcprivacy in Resources */ = {{isa = PBXBuildFile; fileRef = {FR} /* PrivacyInfo.xcprivacy */; }};\n/* End PBXBuildFile section */",
        )
        s = s.replace(
            "/* End PBXFileReference section */",
            f'\t\t{FR} /* PrivacyInfo.xcprivacy */ = {{isa = PBXFileReference; lastKnownFileType = text.xml; path = PrivacyInfo.xcprivacy; sourceTree = "<group>"; }};\n/* End PBXFileReference section */',
        )
        anchor = "/* Info.plist */,\n"
        i = s.index(anchor) + len(anchor)
        s = s[:i] + f"\t\t\t\t{FR} /* PrivacyInfo.xcprivacy */,\n" + s[i:]
        i = s.index("/* Begin PBXResourcesBuildPhase section */")
        j = s.index("files = (", i) + len("files = (")
        s = s[:j] + f"\n\t\t\t\t{BF} /* PrivacyInfo.xcprivacy in Resources */," + s[j:]
    PBX.write_text(s)
    shutil.copy(NATIVE / "PrivacyInfo.xcprivacy", APP / "PrivacyInfo.xcprivacy")


def scene_delegate():
    p = APP / "SceneDelegate.swift"
    s = p.read_text()
    if "N10DocumentImport" in s:
        return
    s = s.replace(
        "        guard let windowScene = scene as? UIWindowScene else { return }\n",
        "        guard let windowScene = scene as? UIWindowScene else { return }\n\n"
        "        // N10: cold launch from \"Open in N10\" / AirDrop / Files — stage the document first.\n"
        "        for context in connectionOptions.urlContexts { N10DocumentImport.stage(context.url) }\n",
    )
    s = s.replace(
        "    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {\n",
        "    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {\n"
        "        // N10: stage the document before Capacitor notifies the web layer (appUrlOpen).\n"
        "        for context in URLContexts { N10DocumentImport.stage(context.url) }\n",
    )
    assert s.count("N10DocumentImport.stage") == 2, "SceneDelegate template changed; patch manually"
    s = s.rstrip() + "\n\n" + (NATIVE / "N10DocumentImport.swift.txt").read_text()
    p.write_text(s)


if __name__ == "__main__":
    info_plist()
    pbxproj()
    scene_delegate()
    print("ios/ customized:", DISPLAY_NAME, MARKETING_VERSION, f"({BUILD_NUMBER})", "iOS", DEPLOYMENT_TARGET, "family", DEVICE_FAMILY)
