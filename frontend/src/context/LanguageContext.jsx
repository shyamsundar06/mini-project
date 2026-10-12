import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' }
];

export const TRANSLATIONS = {
  en: {
    // Header & Nav
    appTitle: 'IntelliTour Guide',
    tourSubtitle: 'Nilgiris Discovery Tour',
    gpsLive: 'GPS Live',
    switchToOperator: 'Switch to Operator Dashboard',
    tabHome: 'My Tour',
    tabVoice: 'AI Voice',
    tabMap: 'Live Map',
    tabSOS: 'SOS Alert',
    welcomeSelectLang: 'Choose Your Preferred Language',
    welcomeSub: 'Select your language before exploring your personalized tourist experience.',
    enterApp: 'Continue to Tourist App',
    currentLanguage: 'Language',

    // Dashboard Cards
    liveAnnouncement: '⚠️ LIVE ANNOUNCEMENT',
    urgentSafetyAlert: '🚨 URGENT SAFETY ALERT',
    understoodSafe: "Understood / I'm Safe",
    activeTour: 'Active Tour',
    dayOf: 'Day 1 of 4',
    tourTitle: 'Nilgiris Grand Heritage & Botanical Discovery',
    tourDestination: 'Ooty & Nilgiri Hills, Tamil Nadu',
    welcome: 'Welcome,',
    checkedIn: 'Checked In',
    myGroup: 'MY GROUP',
    compatibility: '96% Compatibility',
    groupNameAlpha: 'Alpha - Nature Trekkers',
    groupLead: 'Lead: Rahul Kumar (+91 98451 12345)',
    guideAnnouncements: 'GUIDE ANNOUNCEMENTS',
    total: 'total',
    noAnnouncements: 'No announcements yet.',
    acknowledged: '✓ Acknowledged',
    confirmReceipt: 'Confirm Receipt',
    todaySchedule: "Today's Tour Schedule",
    collapse: 'Collapse',
    expand: 'Expand',
    activityProgress: 'Activity Progress',
    completed: 'completed',
    markDone: 'Mark Done',
    checkinComplete: 'Checked In',
    giveFeedback: 'Feedback',
    alternativeRoute: 'AI Adaptive Route',

    // Sample announcement translations
    announcementPaceTitle: 'Pace Coordination',
    announcementPaceMsg: 'Alpha Trekkers: Rain clouds spotted on Doddabetta. Rain gear distribution at lower gate.',

    // Itinerary Item names
    act1: 'Botanical Garden Heritage Walk',
    act1Desc: 'Guided botanical walk through Italian Garden and Toda Arboretum.',
    act2: 'Nilgiri Traditional Thali Lunch',
    act2Desc: 'Authentic regional feast at Shinkows Heritage Hall.',
    act3: 'Nilgiri Tea Estate & Museum Tour',
    act3Desc: 'Factory floor machinery tour, tea leaf picking and tasting.',
    act4: 'Doddabetta Peak & Telescope Observation',
    act4Desc: 'Sweeping vistas of Western Ghats and pine ridge trail.',
    act5: 'Ooty Boathouse & Lake Promenade',
    act5Desc: 'Rowboat ride and evening handicraft bazaar.',

    // Map Gate
    mapGateTitle: 'Tourist GPS Map Verification',
    mapGateSub: 'Please enter your Tourist ID & Password to unlock live satellite telemetry.',
    mapGateHint: 'Tip: You can enter any dummy ID & password (e.g. TRT-101 / pass123).',
    touristIdLabel: 'Tourist ID',
    touristIdPlaceholder: 'Enter any Tourist ID (e.g. TRT-01, Sonika)',
    passwordLabel: 'Passcode / Password',
    passwordPlaceholder: 'Enter any password (e.g. 1234)',
    unlockMapBtn: 'Verify & Unlock Live Map',
    authenticatedAs: 'Verified Tourist',
    lockMapBtn: 'Lock',

    // Map View
    liveGroupMap: 'Live Group Map',
    gardenZone: 'Ooty Botanical Gardens Zone',
    groupDistAlert: 'Group Distance Alert',
    rejoinPrompt: 'You are away from Group Alpha center. Follow the dashed line to rejoin.',
    yourPosition: 'Your Current Position',
    groupLeader: 'Group Alpha Member',
    distanceFromGroup: 'm from group center'
  },

  ta: {
    // Header & Nav
    appTitle: 'இன்டெல்லி டூர் வழிகாட்டி',
    tourSubtitle: 'நீலகிரி பாரம்பரிய சுற்றுலா',
    gpsLive: 'நேரலை GPS',
    switchToOperator: 'நிர்வாகி தளத்திற்கு மாறவும்',
    tabHome: 'என் பயணம்',
    tabVoice: 'AI வாய்ஸ்',
    tabMap: 'நேரலை வரைபடம்',
    tabSOS: 'அவசர உதவி (SOS)',
    welcomeSelectLang: 'உங்கள் விருப்ப மொழியைத் தேர்ந்தெடுக்கவும்',
    welcomeSub: 'சுற்றுலா அனுபவத்தைத் தொடங்குவதற்கு முன் மொழியைத் தேர்ந்தெடுக்கவும்.',
    enterApp: 'செயலிக்குச் செல்லவும்',
    currentLanguage: 'மொழி',

    // Dashboard Cards
    liveAnnouncement: '⚠️ நேரலை அறிவிப்பு',
    urgentSafetyAlert: '🚨 அவசர பாதுகாப்பு எச்சரிக்கை',
    understoodSafe: 'புரிந்துகொண்டேன் / நான் பாதுகாப்பாக உள்ளேன்',
    activeTour: 'தற்போதைய சுற்றுலா',
    dayOf: 'நாள் 1 / 4',
    tourTitle: 'நீலகிரி பெருமைமிக்க பாரம்பரிய மற்றும் தாவரவியல் பயணம்',
    tourDestination: 'ஊட்டி & நீலகிரி மலைகள், தமிழ்நாடு',
    welcome: 'வணக்கம்,',
    checkedIn: 'பதிவு செய்யப்பட்டது',
    myGroup: 'என் குழு',
    compatibility: '96% பொருத்தம்',
    groupNameAlpha: 'ஆல்பா - இயற்கை மலையேறுபவர்கள்',
    groupLead: 'வழிகாட்டி: ராகுல் குமார் (+91 98451 12345)',
    guideAnnouncements: 'வழிகாட்டி அறிவிப்புகள்',
    total: 'மொத்தம்',
    noAnnouncements: 'அறிவிப்புகள் எதுவும் இல்லை.',
    acknowledged: '✓ ஒப்புக்கொள்ளப்பட்டது',
    confirmReceipt: 'பெற்றுக்கொண்டதை உறுதிசெய்',
    todaySchedule: 'இன்றைய சுற்றுலா அட்டவணை',
    collapse: 'சுருக்கு',
    expand: 'விரிவாக்கு',
    activityProgress: 'நிகழ்வுகள் முன்னேற்றம்',
    completed: 'நிறைவுற்றது',
    markDone: 'முடிந்தது',
    checkinComplete: 'பதிவு செய்யப்பட்டது',
    giveFeedback: 'கருத்துரை',
    alternativeRoute: 'AI மாற்றுப் பாதை',

    // Sample announcement translations
    announcementPaceTitle: 'வேக ஒருங்கிணைப்பு',
    announcementPaceMsg: 'ஆல்பா மலையேறுபவர்கள்: தொட்டபெட்டாவில் மழை மேகங்கள் காணப்படுகின்றன. கீழ் வாயிலில் மழை ஆடைகள் விநியோகம் செய்யப்படுகின்றன.',

    // Itinerary Item names
    act1: 'தாவரவியல் பூங்கா பாரம்பரிய நடைபயணம்',
    act1Desc: 'இத்தாலிய தோட்டம் மற்றும் தோடா மரவியல் பூங்காவில் வழிகாட்டப்பட்ட நடைபயணம்.',
    act2: 'நீலகிரி பாரம்பரிய மதிய உணவு',
    act2Desc: 'ஷின்கோஸ் பாரம்பரிய மண்டபத்தில் சுவையான பிராந்திய உணவு விருந்து.',
    act3: 'நீலகிரி தேயிலைத் தோட்டம் & அருங்காட்சியகப் பயணம்',
    act3Desc: 'தேயிலை தொழிற்சாலை இயந்திரங்கள் பார்வை, இலை பறிப்பு மற்றும் தேநீர் சுவைத்தல்.',
    act4: 'தொட்டபெட்டா சிகரம் & தொலைநோக்கி பார்வை',
    act4Desc: 'மேற்கு தொடர்ச்சி மலையின் அழகிய காட்சிகள் மற்றும் பைன் மரப்பாதை.',
    act5: 'ஊட்டி படகு இல்லம் & ஏரிக்கரை உலா',
    act5Desc: 'படகு சவாரி மற்றும் மாலை நேர கைவினைப் பொருட்கள் அங்காடி.',

    // Map Gate
    mapGateTitle: 'சுற்றுலாப் பயணி வரைபட சரிபார்ப்பு',
    mapGateSub: 'நேரலை செயற்கைக்கோள் GPS அணுக உங்கள் ஐடி மற்றும் கடவுச்சொல்லை உள்ளிடவும்.',
    mapGateHint: 'குறிப்பு: ஏதேனும் ஐடி மற்றும் கடவுச்சொல்லை உள்ளிடலாம் (எ.கா: TRT-101 / 1234).',
    touristIdLabel: 'சுற்றுலாப் பயணி ஐடி (Tourist ID)',
    touristIdPlaceholder: 'ஏதேனும் ஐடி உள்ளிடவும் (எ.கா: TRT-01, சோனிகா)',
    passwordLabel: 'கடவுச்சொல் (Password)',
    passwordPlaceholder: 'ஏதேனும் கடவுச்சொல் உள்ளிடவும் (எ.கா: 1234)',
    unlockMapBtn: 'சரிபார்த்து வரைபடத்தைத் திறக்கவும்',
    authenticatedAs: 'சரிபார்க்கப்பட்ட பயணியர்',
    lockMapBtn: 'பூட்டு',

    // Map View
    liveGroupMap: 'நேரலை குழு வரைபடம்',
    gardenZone: 'ஊட்டி தாவரவியல் பூங்கா மண்டலம்',
    groupDistAlert: 'குழு தூர எச்சரிக்கை',
    rejoinPrompt: 'நீங்கள் உங்கள் ஆல்பா குழுவிலிருந்து தள்ளி உள்ளீர்கள். மீண்டும் இணைய கோட்டைப் பின்தொடரவும்.',
    yourPosition: 'உங்கள் தற்போதைய இடம்',
    groupLeader: 'ஆல்பா குழு உறுப்பினர்',
    distanceFromGroup: 'மீட்டர் தூரத்தில் உள்ளது'
  },

  hi: {
    // Header & Nav
    appTitle: 'इंटेलिटूर गाइड',
    tourSubtitle: 'नीलगिरि हेरिटेज टूर',
    gpsLive: 'लाइव जीपीएस',
    switchToOperator: 'ऑपरेटर डैशबोर्ड पर जाएं',
    tabHome: 'मेरी यात्रा',
    tabVoice: 'एआई वॉयस',
    tabMap: 'लाइव मैप',
    tabSOS: 'आपातकालीन एसओएस',
    welcomeSelectLang: 'अपनी पसंदीदा भाषा चुनें',
    welcomeSub: 'पर्यटक अनुभव शुरू करने से पहले अपनी भाषा का चयन करें।',
    enterApp: 'ऐप में प्रवेश करें',
    currentLanguage: 'भाषा',

    // Dashboard Cards
    liveAnnouncement: '⚠️ लाइव घोषणा',
    urgentSafetyAlert: '🚨 आपातकालीन सुरक्षा चेतावनी',
    understoodSafe: 'समझ गया / मैं सुरक्षित हूँ',
    activeTour: 'सक्रिय यात्रा',
    dayOf: 'दिन 1 / 4',
    tourTitle: 'नीलगिरि भव्य विरासत एवं वानस्पतिक खोज',
    tourDestination: 'ऊटी और नीलगिरि पहाड़ियाँ, तमिलनाडु',
    welcome: 'स्वागत है,',
    checkedIn: 'चेक इन हो गया',
    myGroup: 'मेरा समूह',
    compatibility: '96% अनुकूलता',
    groupNameAlpha: 'अल्फा - नेचर ट्रेकर्स',
    groupLead: 'गाइड: राहुल कुमार (+91 98451 12345)',
    guideAnnouncements: 'गाइड की घोषणाएँ',
    total: 'कुल',
    noAnnouncements: 'अभी कोई घोषणा नहीं है।',
    acknowledged: '✓ प्राप्त हुआ',
    confirmReceipt: 'पुष्टि करें',
    todaySchedule: 'आज का यात्रा कार्यक्रम',
    collapse: 'छोटा करें',
    expand: 'विस्तार करें',
    activityProgress: 'गतिविधि प्रगति',
    completed: 'पूर्ण हुआ',
    markDone: 'पूर्ण करें',
    checkinComplete: 'चेक इन पूर्ण',
    giveFeedback: 'प्रतिक्रिया',
    alternativeRoute: 'एआई वैकल्पिक मार्ग',

    // Sample announcement translations
    announcementPaceTitle: 'गति समन्वय',
    announcementPaceMsg: 'अल्फा ट्रेकर्स: डोड्डाबेट्टा पर बारिश के बादल देखे गए हैं। निचले गेट पर रेन गियर वितरण हो रहा है।',

    // Itinerary Item names
    act1: 'बॉटनिकल गार्डन हेरिटेज वॉक',
    act1Desc: 'इटालियन गार्डन और तोड़ा आर्बोरेटम के माध्यम से निर्देशित वॉक।',
    act2: 'नीलगिरि पारंपरिक थाली दोपहर का भोजन',
    act2Desc: 'शिंकोस हेरिटेज हॉल में प्रामाणिक क्षेत्रीय दावत।',
    act3: 'नीलगिरि चाय बागान एवं संग्रहालय भ्रमण',
    act3Desc: 'फैक्ट्री फ्लोर मशीनरी टूर, चाय की पत्ती चुनना और चखना।',
    act4: 'डोड्डाबेट्टा शिखर एवं टेलीस्कोप अवलोकन',
    act4Desc: 'पश्चिमी घाट और पाइन रिज ट्रेल के मनोरम दृश्य।',
    act5: 'ऊटी बोटहाउस एवं झील भ्रमण',
    act5Desc: 'नौका विहार और शाम का हस्तशिल्प बाज़ार।',

    // Map Gate
    mapGateTitle: 'पर्यटक जीपीएस मैप सत्यापन',
    mapGateSub: 'लाइव सैटेलाइट जीपीएस देखने के लिए अपनी आईडी और पासवर्ड दर्ज करें।',
    mapGateHint: 'सुझाव: आप कोई भी डमी आईडी और पासवर्ड दर्ज कर सकते हैं (जैसे TRT-101 / 1234)।',
    touristIdLabel: 'टूरिस्ट आईडी (Tourist ID)',
    touristIdPlaceholder: 'कोई भी आईडी दर्ज करें (उदा. TRT-01, सोनिका)',
    passwordLabel: 'पासवर्ड (Password)',
    passwordPlaceholder: 'कोई भी पासवर्ड दर्ज करें (उदा. 1234)',
    unlockMapBtn: 'सत्यापित करें और मैप खोलें',
    authenticatedAs: 'सत्यापित पर्यटक',
    lockMapBtn: 'लॉक करें',

    // Map View
    liveGroupMap: 'लाइव ग्रुप मैप',
    gardenZone: 'ऊटी बॉटनिकल गार्डन ज़ोन',
    groupDistAlert: 'ग्रुप दूरी चेतावनी',
    rejoinPrompt: 'आप ग्रुप अल्फा केंद्र से दूर हैं। पुनः जुड़ने के लिए डैश्ड लाइन का पालन करें।',
    yourPosition: 'आपकी वर्तमान स्थिति',
    groupLeader: 'ग्रुप अल्फा सदस्य',
    distanceFromGroup: 'मीटर ग्रुप केंद्र से दूर'
  },

  kn: {
    // Header & Nav
    appTitle: 'ಇಂಟೆಲಿಟೂರ್ ಗೈಡ್',
    tourSubtitle: 'ನೀಲಗಿರಿ ಹೆರಿಟೇಜ್ ಪ್ರವಾಸ',
    gpsLive: 'ಲೈವ್ ಜಿಪಿಎಸ್',
    switchToOperator: 'ಆಪರೇಟರ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಬದಲಾಯಿಸಿ',
    tabHome: 'ನನ್ನ ಪ್ರವಾಸ',
    tabVoice: 'AI ಧ್ವನಿ',
    tabMap: 'ಲೈವ್ ನಕ್ಷೆ',
    tabSOS: 'ತುರ್ತು ಎಸ್‌ಒಎಸ್',
    welcomeSelectLang: 'ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    welcomeSub: 'ಪ್ರವಾಸದ ಅನುಭವವನ್ನು ಪ್ರಾರಂಭಿಸುವ ಮೊದಲು ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
    enterApp: 'ಪ್ರವಾಸಕ್ಕೆ ಮುಂದುವರಿಯಿರಿ',
    currentLanguage: 'ಭಾಷೆ',

    // Dashboard Cards
    liveAnnouncement: '⚠️ ಲೈವ್ ಪ್ರಕಟಣೆ',
    urgentSafetyAlert: '🚨 ತುರ್ತು ಸುರಕ್ಷತಾ ಎಚ್ಚರಿಕೆ',
    understoodSafe: 'ತಿಳಿದಿದೆ / ನಾನು ಸುರಕ್ಷಿತವಾಗಿದ್ದೇನೆ',
    activeTour: 'ಪ್ರಸ್ತುತ ಪ್ರವಾಸ',
    dayOf: 'ದಿನ 1 / 4',
    tourTitle: 'ನೀಲಗಿರಿ ಭವ್ಯ ಪರಂಪರೆ ಮತ್ತು ಸಸ್ಯಶಾಸ್ತ್ರೀಯ ಶೋಧ',
    tourDestination: 'ಊಟಿ ಮತ್ತು ನೀಲಗಿರಿ ಬೆಟ್ಟಗಳು, ತಮಿಳುನಾಡು',
    welcome: 'ಸ್ವಾಗತ,',
    checkedIn: 'ಚೆಕ್ ಇನ್ ಆಗಿದೆ',
    myGroup: 'ನನ್ನ ಗುಂಪು',
    compatibility: '96% ಹೊಂದಾಣಿಕೆ',
    groupNameAlpha: 'ಆಲ್ಫಾ - ಪ್ರಕೃತಿ ಚಾರಣಿಗರು',
    groupLead: 'ಮಾರ್ಗದರ್ಶಿ: ರಾಹುಲ್ ಕುಮಾರ್ (+91 98451 12345)',
    guideAnnouncements: 'ಮಾರ್ಗದರ್ಶಿ ಪ್ರಕಟಣೆಗಳು',
    total: 'ಒಟ್ಟು',
    noAnnouncements: 'ಯಾವುದೇ ಪ್ರಕಟಣೆಗಳಿಲ್ಲ.',
    acknowledged: '✓ ಅಂಗೀಕರಿಸಲಾಗಿದೆ',
    confirmReceipt: 'ದೃಢೀಕರಿಸಿ',
    todaySchedule: 'ಇಂದಿನ ಪ್ರವಾಸ ವೇಳಾಪಟ್ಟಿ',
    collapse: 'ಕುಗ್ಗಿಸಿ',
    expand: 'ವಿಸ್ತರಿಸಿ',
    activityProgress: 'ಚಟುವಟಿಕೆ ಪ್ರಗತಿ',
    completed: 'ಪೂರ್ಣಗೊಂಡಿದೆ',
    markDone: 'ಮುಗಿದಿದೆ',
    checkinComplete: 'ಚೆಕ್ ಇನ್ ಪೂರ್ಣ',
    giveFeedback: 'ಪ್ರತಿಕ್ರಿಯೆ',
    alternativeRoute: 'AI ಪರ್ಯಾಯ ಮಾರ್ಗ',

    announcementPaceTitle: 'ವೇಗದ ಸಮನ್ವಯ',
    announcementPaceMsg: 'ಆಲ್ಫಾ ಟ್ರೆಕ್ಕರ್ಸ್: ದೊಡ್ಡಬೆಟ್ಟದಲ್ಲಿ ಮಳೆ ಮೋಡಗಳು ಕಂಡುಬಂದಿವೆ. ಕೆಳಗಿನ ಗೇಟ್‌ನಲ್ಲಿ ಮಳೆ ರಕ್ಷಣಾ ಸಾಮಗ್ರಿ ವಿತರಣೆ ಮಾಡಲಾಗುತ್ತಿದೆ.',

    act1: 'ಬಟಾನಿಕಲ್ ಗಾರ್ಡನ್ ಹೆರಿಟೇಜ್ ವಾಕ್',
    act1Desc: 'ಇಟಾಲಿಯನ್ ಗಾರ್ಡನ್ ಮೂಲಕ ಮಾರ್ಗದರ್ಶನದ ನಡಿಗೆ.',
    act2: 'ನೀಲಗಿರಿ ಸಾಂಪ್ರದಾಯಿಕ ಊಟ',
    act2Desc: 'ಪ್ರಾದೇಶಿಕ ಆಹಾರದ ರುಚಿ.',
    act3: 'ನೀಲಗಿರಿ ಟೀ ಎಸ್ಟೇಟ್ ಮತ್ತು ಮ್ಯೂಸಿಯಂ',
    act3Desc: 'ಟೀ ಎಸ್ಟೇಟ್ ಮತ್ತು ಕಾರ್ಖಾನೆ ವೀಕ್ಷಣೆ.',
    act4: 'ದೊಡ್ಡಬೆಟ್ಟ ಶಿಖರ ಮತ್ತು ಟೆಲಿಸ್ಕೋಪ್',
    act4Desc: 'ಪಶ್ಚಿಮ ಘಟ್ಟಗಳ ಸುಂದರ ನೋಟ.',
    act5: 'ಊಟಿ ಬೋಟ್‌ಹೌಸ್ ಮತ್ತು ಸರೋವರ',
    act5Desc: 'ದೋಣಿ ವಿಹಾರ ಮತ್ತು ಸಂಜೆಯ ಮಾರುಕಟ್ಟೆ.',

    // Map Gate
    mapGateTitle: 'ಪ್ರವಾಸಿ ಜಿಪಿಎಸ್ ನಕ್ಷೆ ಪರಿಶೀಲನೆ',
    mapGateSub: 'ಲೈವ್ ಜಿಪಿಎಸ್ ಪ್ರವೇಶಿಸಲು ನಿಮ್ಮ ಪ್ರವಾಸಿ ಐಡಿ ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ.',
    mapGateHint: 'ಸೂಚನೆ: ನೀವು ಯಾವುದೇ ಡಮ್ಮಿ ಐಡಿ ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಬಹುದು (ಉದಾ: TRT-101 / 1234).',
    touristIdLabel: 'ಪ್ರವಾಸಿ ಐಡಿ (Tourist ID)',
    touristIdPlaceholder: 'ಯಾವುದೇ ಐಡಿ ನಮೂದಿಸಿ (ಉದಾ: TRT-01)',
    passwordLabel: 'ಪಾಸ್‌ವರ್ಡ್ (Password)',
    passwordPlaceholder: 'ಯಾವುದೇ ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ (ಉದಾ: 1234)',
    unlockMapBtn: 'ಪರಿಶೀಲಿಸಿ ಮತ್ತು ನಕ್ಷೆಯನ್ನು ತೆರೆಯಿರಿ',
    authenticatedAs: 'ದೃಢೀಕರಿಸಿದ ಪ್ರವಾಸಿ',
    lockMapBtn: 'ಲಾಕ್',

    // Map View
    liveGroupMap: 'ಲೈವ್ ಗುಂಪು ನಕ್ಷೆ',
    gardenZone: 'ಊಟಿ ಬಟಾನಿಕಲ್ ಗಾರ್ಡನ್ ವಲಯ',
    groupDistAlert: 'ಗುಂಪಿನ ಅಂತರ ಎಚ್ಚರಿಕೆ',
    rejoinPrompt: 'ನೀವು ಆಲ್ಫಾ ಗುಂಪಿನಿಂದ ದೂರವಿದ್ದೀರಿ. ಮರುಜೋಡಿಸಲು ಮಾರ್ಗವನ್ನು ಅನುಸರಿಸಿ.',
    yourPosition: 'ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಸ್ಥಳ',
    groupLeader: 'ಆಲ್ಫಾ ಗುಂಪಿನ ಸದಸ್ಯ',
    distanceFromGroup: 'ಮೀಟರ್ ದೂರದಲ್ಲಿದೆ'
  },

  te: {
    // Header & Nav
    appTitle: 'ఇంటెలిటూర్ గైడ్',
    tourSubtitle: 'నీలగిరి హెరిటేజ్ పర్యటన',
    gpsLive: 'లైవ్ జీపీఎస్',
    switchToOperator: 'ఆపరేటర్ డ్యాష్‌బోర్డ్‌కు మారండి',
    tabHome: 'నా పర్యటన',
    tabVoice: 'AI వాయిస్',
    tabMap: 'లైవ్ మ్యాప్',
    tabSOS: 'అత్యవసర SOS',
    welcomeSelectLang: 'మీ ప్రాధాన్యత భాషను ఎంచుకోండి',
    welcomeSub: 'పర్యటన ప్రారంభించడానికి ముందు మీ భాషను ఎంచుకోండి.',
    enterApp: 'యాప్‌లోకి కొనసాగండి',
    currentLanguage: 'భాష',

    // Dashboard Cards
    liveAnnouncement: '⚠️ లైవ్ ప్రకటన',
    urgentSafetyAlert: '🚨 అత్యవసర భద్రతా హెచ్చరిక',
    understoodSafe: 'అర్థమైంది / నేను సురక్షితంగా ఉన్నాను',
    activeTour: 'ప్రస్తుత పర్యటన',
    dayOf: 'రోజు 1 / 4',
    tourTitle: 'నీలగిరి గ్రాండ్ హెరిటేజ్ & బొటానికల్ అన్వేషణ',
    tourDestination: 'ఊటీ & నీలగిరి కొండలు, తమిళనాడు',
    welcome: 'స్వాగతం,',
    checkedIn: 'చెక్ ఇన్ పూర్తయింది',
    myGroup: 'నా గ్రూప్',
    compatibility: '96% అనుకూలత',
    groupNameAlpha: 'ఆల్ఫా - ప్రకృతి యాత్రికులు',
    groupLead: 'గైడ్: రాహుల్ కుమార్ (+91 98451 12345)',
    guideAnnouncements: 'గైడ్ ప్రకటనలు',
    total: 'మొత్తం',
    noAnnouncements: 'ప్రకటనలు లేవు.',
    acknowledged: '✓ ధృవీకరించబడింది',
    confirmReceipt: 'రసీదు నిర్ధారించండి',
    todaySchedule: 'నేటి పర్యటన షెడ్యూల్',
    collapse: 'కుదించు',
    expand: 'విస్తరించు',
    activityProgress: 'కార్యకలాపాల పురోగతి',
    completed: 'పూర్తయింది',
    markDone: 'పూర్తయింది',
    checkinComplete: 'చెక్ ఇన్ పూర్తయింది',
    giveFeedback: 'ఫీడ్‌బ్యాక్',
    alternativeRoute: 'AI ప్రత్యామ్నాయ మార్గం',

    announcementPaceTitle: 'వేగం సమన్వయం',
    announcementPaceMsg: 'ఆల్ఫా ట్రెక్కర్స్: దొడ్డబెట్ట వద్ద వర్షపు మేఘాలు కనిపించాయి. దిగువ గేట్ వద్ద రెయిన్ గేర్ పంపిణీ జరుగుతోంది.',

    act1: 'బొటానికల్ గార్డెన్ హెరిటేజ్ వాక్',
    act1Desc: 'ఇటాలియన్ గార్డెన్ ద్వారా గైడెడ్ వాక్.',
    act2: 'నీలగిరి సంప్రదాయ భోజనం',
    act2Desc: 'ప్రాంతీయ రుచికరమైన విందు.',
    act3: 'నీలగిరి టీ ఎస్టేట్ మరియు మ్యూజియం',
    act3Desc: 'టీ ఫ్యాక్టరీ మెషినరీ మరియు టేస్టింగ్ టూర్.',
    act4: 'దొడ్డబెట్ట శిఖరం మరియు టెలిస్కోప్',
    act4Desc: 'పశ్చిమ కనుమల అద్భుత దృశ్యాలు.',
    act5: 'ఊటీ బోట్‌హౌస్ మరియు సరస్సు',
    act5Desc: 'బోట్ రైడ్ మరియు ఈవినింగ్ బజార్.',

    // Map Gate
    mapGateTitle: 'పర్యాటక జీపీఎస్ మ్యాప్ ధృవీకరణ',
    mapGateSub: 'లైవ్ జీపీఎస్ చూడటానికి మీ పర్యాటక ఐడీ మరియు పాస్‌వర్డ్ నమోదు చేయండి.',
    mapGateHint: 'సూచన: మీరు ఏదైనా డమ్మీ ఐడీ మరియు పాస్‌వర్డ్ నమోదు చేయవచ్చు (ఉదా: TRT-101 / 1234).',
    touristIdLabel: 'టూరిస్ట్ ఐడీ (Tourist ID)',
    touristIdPlaceholder: 'ఏదైనా ఐడీ నమోదు చేయండి (ఉదా: TRT-01)',
    passwordLabel: 'పాస్‌వర్డ్ (Password)',
    passwordPlaceholder: 'ఏదైనా పాస్‌వర్డ్ నమోదు చేయండి (ఉదా: 1234)',
    unlockMapBtn: 'ధృవీకరించి మ్యాప్‌ను తెరవండి',
    authenticatedAs: 'ధృవీకరించబడిన టూరిస్ట్',
    lockMapBtn: 'లాక్',

    // Map View
    liveGroupMap: 'లైవ్ గ్రూప్ మ్యాప్',
    gardenZone: 'ఊటీ బొటానికల్ గార్డెన్స్ జోన్',
    groupDistAlert: 'గ్రూప్ దూరం హెచ్చరిక',
    rejoinPrompt: 'మీరు గ్రూప్ ఆల్ఫా కేంద్రం నుండి దూరంగా ఉన్నారు.',
    yourPosition: 'మీ ప్రస్తుత స్థానం',
    groupLeader: 'ఆల్ఫా గ్రూప్ సభ్యుడు',
    distanceFromGroup: 'మీటర్ల దూరంలో ఉన్నారు'
  },

  ml: {
    // Header & Nav
    appTitle: 'ഇന്റലിടൂർ ഗൈഡ്',
    tourSubtitle: 'നീലഗിരി പൈതൃക പര്യടനം',
    gpsLive: 'ലൈവ് ജിപിഎസ്',
    switchToOperator: 'ഓപ്പറേറ്റർ ഡാഷ്‌ബോർഡിലേക്ക് മാറുക',
    tabHome: 'എന്റെ ടൂർ',
    tabVoice: 'AI വോയ്സ്',
    tabMap: 'ലൈവ് മാപ്പ്',
    tabSOS: 'അടിയന്തര SOS',
    welcomeSelectLang: 'നിങ്ങളുടെ ഇഷ്ട ഭാഷ തിരഞ്ഞെടുക്കുക',
    welcomeSub: 'യാത്ര ആരംഭിക്കുന്നതിന് മുൻപ് ഭാഷ തിരഞ്ഞെടുക്കുക.',
    enterApp: 'ആപ്പിലേക്ക് പ്രവേശിക്കുക',
    currentLanguage: 'ഭാഷ',

    // Dashboard Cards
    liveAnnouncement: '⚠️ ലൈവ് അറിയിപ്പ്',
    urgentSafetyAlert: '🚨 അടിയന്തര സുരക്ഷാ മുന്നറിയിപ്പ്',
    understoodSafe: 'മനസ്സിലായി / ഞാൻ സുരക്ഷിതനാണ്',
    activeTour: 'നിലവിലെ ടൂർ',
    dayOf: 'ദിവസം 1 / 4',
    tourTitle: 'നീലഗിരി പൈതൃക ബൊട്ടാണിക്കൽ പര്യവേക്ഷണം',
    tourDestination: 'ഊട്ടി & നീലഗിരി കുന്നുകൾ, തമിഴ്നാട്',
    welcome: 'സ്വാഗതം,',
    checkedIn: 'ചെക്ക് ഇൻ ചെയ്തു',
    myGroup: 'എന്റെ ഗ്രൂപ്പ്',
    compatibility: '96% പൊരുത്തം',
    groupNameAlpha: 'ആൽഫ - നേച്ചർ ട്രക്കേഴ്സ്',
    groupLead: 'ഗൈഡ്: രാഹുൽ കുമാർ (+91 98451 12345)',
    guideAnnouncements: 'ഗൈഡ് അറിയിപ്പുകൾ',
    total: 'ആകെ',
    noAnnouncements: 'അറിയിപ്പുകളൊന്നുമില്ല.',
    acknowledged: '✓ സ്വീകരിച്ചു',
    confirmReceipt: 'സ്ഥിരീകരിക്കുക',
    todaySchedule: 'ഇന്നത്തെ ടൂർ ഷെഡ്യൂൾ',
    collapse: 'ചുരുക്കുക',
    expand: 'വികസിപ്പിക്കുക',
    activityProgress: 'പുരോഗതി',
    completed: 'പൂർത്തിയായി',
    markDone: 'പൂർത്തിയായി',
    checkinComplete: 'ചെക്ക് ഇൻ പൂർത്തിയായി',
    giveFeedback: 'ഫീഡ്‌ബാക്ക്',
    alternativeRoute: 'AI ബദൽ റൂട്ട്',

    announcementPaceTitle: 'വേഗത ഏകോപനം',
    announcementPaceMsg: 'ആൽഫ ട്രക്കേഴ്സ്: ദൊഡ്ഡബെട്ടയിൽ മഴമേഘങ്ങൾ കണ്ടു. താഴത്തെ ഗേറ്റിൽ മഴക്കോട്ടുകൾ വിതരണം ചെയ്യുന്നുണ്ട്.',

    act1: 'ബൊട്ടാണിക്കൽ ഗാർഡൻ ഹെറിറ്റേജ് വാക്ക്',
    act1Desc: 'ഇറ്റാലിയൻ ഗാർഡനിലൂടെയുള്ള പ്രഭാത നടത്തം.',
    act2: 'പരമ്പരാഗത നീലഗിരി സദ്യ',
    act2Desc: 'ഷിങ്കോസ് ഹാളിലെ വിഭവസമൃദ്ധമായ ഉച്ചഭക്ഷണം.',
    act3: 'നീലഗിരി തേയിലത്തോട്ടവും മ്യൂസിയവും',
    act3Desc: 'തേയില ഫാക്ടറി സന്ദർശനവും രുചി പരിശോധനയും.',
    act4: 'ദൊഡ്ഡബെട്ട കൊടുമുടിയും ടെലിസ്കോപ്പും',
    act4Desc: 'പശ്ചിമഘട്ടത്തിന്റെ മനോഹര ദൃശ്യങ്ങൾ.',
    act5: 'ഊട്ടി ലേക്ക് ബോട്ട് ഹൗസ്',
    act5Desc: 'ബോട്ടിംഗും വൈകുന്നേരത്തെ കരകൗശല വിപണിയും.',

    // Map Gate
    mapGateTitle: 'ടൂറിസ്റ്റ് ജിപിഎസ് മാപ്പ് സ്ഥിരീകരണം',
    mapGateSub: 'ലൈവ് സാറ്റലൈറ്റ് ജിപിഎസ് ആക്സസ് ചെയ്യാൻ നിങ്ങളുടെ ഐഡിയും പാസ്‌വേഡും നൽകുക.',
    mapGateHint: 'സൂചന: നിങ്ങൾക്ക് ഏത് ഡമ്മി ഐഡിയും പാസ്‌വേഡും നൽകാം (ഉദാ: TRT-101 / 1234).',
    touristIdLabel: 'ടൂറിസ്റ്റ് ഐഡി (Tourist ID)',
    touristIdPlaceholder: 'ഏതെങ്കിലും ഐഡി നൽകുക (ഉദാ: TRT-01)',
    passwordLabel: 'പാസ്‌വേഡ് (Password)',
    passwordPlaceholder: 'ഏതെങ്കിലും പാസ്‌വേഡ് നൽകുക (ഉദാ: 1234)',
    unlockMapBtn: 'സ്ഥിരീകരിച്ച് മാപ്പ് തുറക്കുക',
    authenticatedAs: 'സ്ഥിരീകരിച്ച ടൂറിസ്റ്റ്',
    lockMapBtn: 'ലോക്ക്',

    // Map View
    liveGroupMap: 'ലൈവ് ഗ്രൂപ്പ് മാപ്പ്',
    gardenZone: 'ഊട്ടി ബൊട്ടാണിക്കൽ ഗാർഡൻ സോൺ',
    groupDistAlert: 'ഗ്രൂപ്പ് അകല മുന്നറിയിപ്പ്',
    rejoinPrompt: 'നിങ്ങൾ ഗ്രൂപ്പ് ആൽഫ കേന്ദ്രത്തിൽ നിന്ന് അകലെയാണ്.',
    yourPosition: 'നിങ്ങളുടെ നിലവിലെ സ്ഥാനം',
    groupLeader: 'ആൽഫ ഗ്രൂപ്പ് അംഗം',
    distanceFromGroup: 'മീറ്റർ ഗ്രൂപ്പ് കേന്ദ്രത്തിൽ നിന്ന്'
  }
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('tourist_selected_language') || 'en';
  });

  const [hasChosenLang, setHasChosenLang] = useState(() => {
    return localStorage.getItem('tourist_has_chosen_lang') === 'true';
  });

  const selectLanguage = (code) => {
    setLang(code);
    localStorage.setItem('tourist_selected_language', code);
    localStorage.setItem('tourist_has_chosen_lang', 'true');
    setHasChosenLang(true);
  };

  const t = (key) => {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
    return dict[key] || TRANSLATIONS.en[key] || key;
  };

  // Helper to translate dynamic broadcast messages
  const translateAnnouncement = (title, message) => {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
    if (title?.toLowerCase().includes('pace') || message?.toLowerCase().includes('rain')) {
      return {
        title: dict.announcementPaceTitle || title,
        message: dict.announcementPaceMsg || message
      };
    }
    return { title, message };
  };

  // Helper to translate dynamic itinerary activity titles
  const translateActivity = (title, desc, idx) => {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
    const lower = (title || '').toLowerCase();
    if (lower.includes('botanical') || idx === 0) {
      return { title: dict.act1 || title, desc: dict.act1Desc || desc };
    }
    if (lower.includes('thali') || lower.includes('lunch') || idx === 1) {
      return { title: dict.act2 || title, desc: dict.act2Desc || desc };
    }
    if (lower.includes('tea') || idx === 2) {
      return { title: dict.act3 || title, desc: dict.act3Desc || desc };
    }
    if (lower.includes('doddabetta') || idx === 3) {
      return { title: dict.act4 || title, desc: dict.act4Desc || desc };
    }
    if (lower.includes('boat') || lower.includes('lake') || idx === 4) {
      return { title: dict.act5 || title, desc: dict.act5Desc || desc };
    }
    return { title, desc };
  };

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang: selectLanguage,
        t,
        translateAnnouncement,
        translateActivity,
        hasChosenLang,
        setHasChosenLang,
        currentLanguageObj: LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0],
        LANGUAGES
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
