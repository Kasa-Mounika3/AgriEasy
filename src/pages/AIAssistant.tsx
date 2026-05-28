import React, { useState, useRef, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Mic, 
  Volume2, 
  Bot, 
  User, 
  Camera, 
  Image as ImageIcon, 
  X,
  VolumeX,
  Languages,
  Loader2,
  MicOff,
  ChevronLeft,
  RefreshCw,
  CheckCircle2,
  Info,
  AlertTriangle
} from 'lucide-react';
import { ai, MODELS } from '@/lib/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useLocationContext } from '@/contexts/LocationContext';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import SafeImage from '@/components/SafeImage';
import { moduleImages } from '@/lib/imageAssets';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  timestamp: number;
}

const INDIAN_LANGUAGES = [
  { name: 'English', code: 'en-IN' },
  { name: 'Hindi', code: 'hi-IN' },
  { name: 'Telugu', code: 'te-IN' },
  { name: 'Tamil', code: 'ta-IN' },
  { name: 'Kannada', code: 'kn-IN' },
  { name: 'Malayalam', code: 'ml-IN' },
  { name: 'Marathi', code: 'mr-IN' },
  { name: 'Gujarati', code: 'gu-IN' },
  { name: 'Bengali', code: 'bn-IN' },
  { name: 'Punjabi', code: 'pa-IN' },
  { name: 'Odia', code: 'or-IN' },
  { name: 'Assamese', code: 'as-IN' },
  { name: 'Urdu', code: 'ur-IN' },
  { name: 'Konkani', code: 'kok-IN' },
  { name: 'Sanskrit', code: 'sa-IN' },
  { name: 'Kashmiri', code: 'ks-IN' },
  { name: 'Sindhi', code: 'sd-IN' },
  { name: 'Manipuri', code: 'mni-IN' },
  { name: 'Bodo', code: 'brx-IN' },
  { name: 'Santhali', code: 'sat-IN' },
  { name: 'Dogri', code: 'doi-IN' },
  { name: 'Maithili', code: 'mai-IN' },
  { name: 'Nepali', code: 'ne-NP' }
];

type FarmingIntent =
  | 'image_diagnosis'
  | 'crop_disease_or_pest'
  | 'fertilizer_or_pesticide'
  | 'irrigation'
  | 'soil'
  | 'weather'
  | 'market_demand'
  | 'storage_post_harvest'
  | 'crop_recommendation'
  | 'general_farming'
  | 'unclear';

const INTENT_LABELS: Record<FarmingIntent, string> = {
  image_diagnosis: 'image-based crop or farm diagnosis',
  crop_disease_or_pest: 'crop disease, pest, leaf damage, wilting, spotting, or plant health',
  fertilizer_or_pesticide: 'fertilizer, pesticide, spray, nutrient, or dosage advice',
  irrigation: 'irrigation, watering, drainage, or water management',
  soil: 'soil health, pH, salinity, compost, manure, or soil preparation',
  weather: 'weather-based farming decision',
  market_demand: 'market demand, price, selling, or crop demand',
  storage_post_harvest: 'cold storage, storage, harvesting, grading, packing, or post-harvest',
  crop_recommendation: 'crop selection or crop planning',
  general_farming: 'general agriculture question',
  unclear: 'unclear farming question',
};

const LANGUAGE_NATIVE_NAMES: Record<string, string> = {
  English: 'English',
  Hindi: 'हिन्दी',
  Telugu: 'తెలుగు',
  Tamil: 'தமிழ்',
  Kannada: 'ಕನ್ನಡ',
  Malayalam: 'മലയാളം',
  Marathi: 'मराठी',
  Gujarati: 'ગુજરાતી',
  Bengali: 'বাংলা',
  Punjabi: 'ਪੰਜਾਬੀ',
  Odia: 'ଓଡ଼ିଆ',
  Assamese: 'অসমীয়া',
  Urdu: 'اردو',
  Konkani: 'कोंकणी',
  Sanskrit: 'संस्कृतम्',
  Kashmiri: 'कॉशुर',
  Sindhi: 'سنڌي',
  Manipuri: 'মৈতৈলোন্',
  Bodo: 'बर’',
  Santhali: 'ᱥᱟᱱᱛᱟᱲᱤ',
  Dogri: 'डोगरी',
  Maithili: 'मैथिली',
  Nepali: 'नेपाली',
};

const LOCALIZED_CLARIFICATION: Record<string, string> = {
  English: 'Please tell me the crop name and the exact farming problem you are seeing.',
  Hindi: 'कृपया फसल का नाम और दिखाई दे रही खेती की समस्या स्पष्ट बताएं।',
  Telugu: 'దయచేసి పంట పేరు మరియు మీరు చూస్తున్న ఖచ్చితమైన వ్యవసాయ సమస్యను చెప్పండి.',
  Tamil: 'தயவுசெய்து பயிரின் பெயரும் நீங்கள் காணும் சரியான விவசாயப் பிரச்சினையும் சொல்லுங்கள்.',
  Kannada: 'ದಯವಿಟ್ಟು ಬೆಳೆ ಹೆಸರನ್ನೂ ನೀವು ನೋಡುತ್ತಿರುವ ನಿಖರ ಕೃಷಿ ಸಮಸ್ಯೆಯನ್ನೂ ತಿಳಿಸಿ.',
  Malayalam: 'ദയവായി വിളയുടെ പേരും നിങ്ങൾ കാണുന്ന കൃത്യമായ കൃഷി പ്രശ്നവും പറയൂ.',
  Marathi: 'कृपया पिकाचे नाव आणि दिसणारी नेमकी शेती समस्या सांगा.',
  Gujarati: 'કૃપા કરીને પાકનું નામ અને દેખાતી ચોક્કસ ખેતી સમસ્યા જણાવો.',
  Bengali: 'অনুগ্রহ করে ফসলের নাম এবং আপনি যে সঠিক কৃষি সমস্যা দেখছেন তা বলুন।',
  Punjabi: 'ਕਿਰਪਾ ਕਰਕੇ ਫਸਲ ਦਾ ਨਾਮ ਅਤੇ ਦਿਖ ਰਹੀ ਸਹੀ ਖੇਤੀ ਸਮੱਸਿਆ ਦੱਸੋ।',
  Odia: 'ଦୟାକରି ଫସଲର ନାମ ଏବଂ ଆପଣ ଦେଖୁଥିବା ସଠିକ୍ କୃଷି ସମସ୍ୟା କହନ୍ତୁ।',
  Assamese: 'অনুগ্ৰহ কৰি শস্যৰ নাম আৰু আপুনি দেখা সঠিক কৃষি সমস্যাটো কওক।',
  Urdu: 'براہ کرم فصل کا نام اور نظر آنے والا درست زرعی مسئلہ بتائیں۔',
  Konkani: 'कृपया पिकाचे नाव आनी दिसपी खरी शेती समस्या सांगात.',
  Sanskrit: 'कृपया सस्यनाम तथा दृश्यां कृषिसमस्यां स्पष्टं वदतु।',
  Kashmiri: 'مہربانی کٔرِتھ فصلُک ناو تہٕ کھیتی ہُند اصل مسئلہ وٲنٛیو۔',
  Sindhi: 'مهرباني ڪري فصل جو نالو ۽ صحيح زرعي مسئلو ٻڌايو.',
  Manipuri: 'চানবিদুনা ফসলগী মিং অমসুং উবা কৃষি সমস্যা অদু হায়বিয়ু।',
  Bodo: 'अननानै फसलनि मुं आरो नोंथाङा नुनाय थार खामानि जेंनाखौ खिन्था।',
  Santhali: 'ᱢᱮᱦᱮᱨᱵᱟᱱᱤ ᱠᱟᱛᱮ ᱯᱟᱥᱞᱟ ᱧᱩᱛᱩᱢ ᱟᱨ ᱠᱷᱮᱛᱤ ᱫᱤᱠᱠᱚᱛ ᱞᱟᱹᱭ ᱢᱮ।',
  Dogri: 'कृपा करिए फसल दा नां ते दिखदी सही खेती समस्या दस्सो।',
  Maithili: 'कृपया फसलक नाम आ देखाइत ठीक खेती समस्या बताउ।',
  Nepali: 'कृपया बालीको नाम र देखिएको ठ्याक्कै खेती समस्या बताउनुहोस्।',
};

const LOCALIZED_IMAGE_CLARIFICATION: Record<string, string> = {
  English: 'Please add the crop name and the problem you want me to check in this image, such as yellow leaves, spots, insects, wilting, fruit damage, or soil issue.',
  Hindi: 'कृपया फसल का नाम और इस फोटो में दिख रही समस्या बताएं, जैसे पीली पत्तियां, धब्बे, कीट, मुरझाना, फल नुकसान या मिट्टी की समस्या।',
  Telugu: 'దయచేసి పంట పేరు మరియు ఈ చిత్రంలో చూడాల్సిన సమస్యను చెప్పండి, ఉదాహరణకు పసుపు ఆకులు, మచ్చలు, పురుగులు, వాడిపోవడం, పండు నష్టం లేదా మట్టి సమస్య.',
  Tamil: 'தயவுசெய்து பயிரின் பெயரும் இந்தப் படத்தில் பார்க்க வேண்டிய பிரச்சினையும் சொல்லுங்கள், உதாரணமாக மஞ்சள் இலை, புள்ளிகள், பூச்சி, வாடுதல், பழ சேதம் அல்லது மண் பிரச்சினை.',
  Kannada: 'ದಯವಿಟ್ಟು ಬೆಳೆ ಹೆಸರು ಮತ್ತು ಈ ಚಿತ್ರದಲ್ಲಿ ಪರಿಶೀಲಿಸಬೇಕಾದ ಸಮಸ್ಯೆಯನ್ನು ತಿಳಿಸಿ, ಉದಾ: ಹಳದಿ ಎಲೆ, ಕಲೆ, ಕೀಟ, ಒಣಗುವುದು, ಹಣ್ಣು ಹಾನಿ ಅಥವಾ ಮಣ್ಣು ಸಮಸ್ಯೆ.',
  Malayalam: 'ദയവായി വിളയുടെ പേരും ഈ ചിത്രത്തിൽ പരിശോധിക്കേണ്ട പ്രശ്നവും പറയൂ, ഉദാഹരണത്തിന് മഞ്ഞ ഇലകൾ, പാടുകൾ, കീടങ്ങൾ, വാടൽ, ഫലനാശം അല്ലെങ്കിൽ മണ്ണ് പ്രശ്നം.',
  Marathi: 'कृपया पिकाचे नाव आणि या फोटोमध्ये तपासायची समस्या सांगा, जसे पिवळी पाने, डाग, कीड, कोमेजणे, फळांचे नुकसान किंवा मातीची समस्या.',
  Gujarati: 'કૃપા કરીને પાકનું નામ અને આ ફોટામાં તપાસવાની સમસ્યા જણાવો, જેમ કે પીળાં પાન, ડાઘ, જીવાત, સુકાવું, ફળનું નુકસાન અથવા માટીની સમસ્યા.',
  Bengali: 'অনুগ্রহ করে ফসলের নাম এবং এই ছবিতে কোন সমস্যা দেখতে হবে তা বলুন, যেমন হলুদ পাতা, দাগ, পোকা, ঝিমিয়ে পড়া, ফলের ক্ষতি বা মাটির সমস্যা।',
  Punjabi: 'ਕਿਰਪਾ ਕਰਕੇ ਫਸਲ ਦਾ ਨਾਮ ਅਤੇ ਇਸ ਤਸਵੀਰ ਵਿੱਚ ਜਾਂਚਣ ਵਾਲੀ ਸਮੱਸਿਆ ਦੱਸੋ, ਜਿਵੇਂ ਪੀਲੇ ਪੱਤੇ, ਧੱਬੇ, ਕੀੜੇ, ਮੁਰਝਾਉਣਾ, ਫਲ ਦਾ ਨੁਕਸਾਨ ਜਾਂ ਮਿੱਟੀ ਦੀ ਸਮੱਸਿਆ।',
  Odia: 'ଦୟାକରି ଫସଲର ନାମ ଏବଂ ଏହି ଛବିରେ ଯାଞ୍ଚ କରିବାକୁ ଥିବା ସମସ୍ୟା କହନ୍ତୁ, ଯେପରିକି ହଳଦିଆ ପତ୍ର, ଦାଗ, ପୋକ, ମୁର୍ଜାଇବା, ଫଳ କ୍ଷତି କିମ୍ବା ମାଟି ସମସ୍ୟା।',
  Assamese: 'অনুগ্ৰহ কৰি শস্যৰ নাম আৰু এই ছবিত চাবলগীয়া সমস্যাটো কওক, যেনে হালধীয়া পাত, দাগ, পোক, মৰহা, ফলৰ ক্ষতি বা মাটিৰ সমস্যা।',
  Urdu: 'براہ کرم فصل کا نام اور اس تصویر میں دیکھی جانے والی مسئلہ بتائیں، جیسے پیلے پتے، دھبے، کیڑے، مرجھانا، پھل کا نقصان یا مٹی کا مسئلہ۔',
  Konkani: 'कृपया पिकाचे नाव आनी ह्या फोटोत तपासपाची समस्या सांगात, जशी पिवळी पाने, डाग, कीड, कोमेजप, फळांचे नुकसान वा मातीची समस्या.',
  Sanskrit: 'कृपया सस्यनाम तथा अस्मिन् चित्रे परीक्षितव्या समस्या वदतु, यथा पीतानि पत्राणि, बिन्दवः, कीटाः, म्लानता, फलहानिः वा मृदा समस्या।',
  Kashmiri: 'مہربانی کٔرِتھ فصلُک ناو تہٕ اَمہ تصویرس منز مسئلہ وٲنٛیو، مثلاً زرد پَن، داغ، کیٖڑ، مرجھاو، پھلُک نقصان یا مٹی ہُند مسئلہ۔',
  Sindhi: 'مهرباني ڪري فصل جو نالو ۽ هن تصوير ۾ ڏسڻو مسئلو ٻڌايو، جيئن پيلا پن، داغ، ڪيڙا، مرجهائڻ، ميوي جو نقصان يا مٽي جو مسئلو.',
  Manipuri: 'চানবিদুনা ফসলগী মিং অমসুং মসিগী ছবি অসিদা য়েংগদবা সমস্যা হায়বিয়ু, যেনা মচু হংবা পাত, দাগ, পোকপী, শুকখিবা, ফলগী ক্ষতি নত্রগা লৌমী সমস্যা।',
  Bodo: 'अननानै फसलनि मुं आरो बे सावगारियाव नायनो गोनां जेंना खिन्था, जेरै गोमो पात, दाग, एमफौ, सुकायनाय, फलनि खहा एबा हा जेंना।',
  Santhali: 'ᱢᱮᱦᱮᱨᱵᱟᱱᱤ ᱠᱟᱛᱮ ᱯᱟᱥᱞᱟ ᱧᱩᱛᱩᱢ ᱟᱨ ᱱᱚᱶᱟ ᱪᱤᱛᱟᱹᱨ ᱨᱮ ᱧᱮᱞ ᱫᱟᱨᱠᱟᱨ ᱫᱤᱠᱠᱚᱛ ᱞᱟᱹᱭ ᱢᱮ।',
  Dogri: 'कृपा करिए फसल दा नां ते इस फोटो च जांचणी समस्या दस्सो, जियां पीले पत्ते, धब्बे, कीड़े, मुरझाना, फल दा नुकसान या मिट्टी दी समस्या।',
  Maithili: 'कृपया फसलक नाम आ एहि फोटोमे देखएबाक समस्या बताउ, जेना पीयर पात, दाग, कीड़ा, मुरझेनाइ, फलक नुकसान वा माटिक समस्या।',
  Nepali: 'कृपया बालीको नाम र यो फोटोमा जाँच्नुपर्ने समस्या बताउनुहोस्, जस्तै पहेँला पात, दाग, किरा, ओइलिनु, फल क्षति वा माटो समस्या।',
};

type LanguageOption = (typeof INDIAN_LANGUAGES)[number];

function includesAny(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}

function detectFarmingIntent(userInput: string, hasImage: boolean): FarmingIntent {
  const text = userInput.toLowerCase().trim();
  if (hasImage) return 'image_diagnosis';
  if (!text || text.split(/\s+/).length < 2) return 'unclear';

  if (includesAny(text, ['disease', 'pest', 'insect', 'bug', 'worm', 'fungus', 'fungal', 'blight', 'rot', 'mildew', 'yellow', 'spot', 'spots', 'wilting', 'wilt', 'curl', 'leaf', 'leaves', 'damage', 'infection'])) {
    return 'crop_disease_or_pest';
  }
  if (includesAny(text, ['fertilizer', 'fertiliser', 'urea', 'dap', 'npk', 'potash', 'nitrogen', 'phosphorus', 'pesticide', 'spray', 'dose', 'dosage', 'nutrient', 'manure', 'compost'])) {
    return 'fertilizer_or_pesticide';
  }
  if (includesAny(text, ['water', 'irrigation', 'drip', 'sprinkler', 'drainage', 'flood', 'moisture', 'watering'])) {
    return 'irrigation';
  }
  if (includesAny(text, ['soil', 'ph', 'salinity', 'alkaline', 'acidic', 'loam', 'clay', 'sandy', 'land preparation'])) {
    return 'soil';
  }
  if (includesAny(text, ['weather', 'rain', 'temperature', 'heat', 'cold', 'frost', 'humidity', 'wind', 'monsoon', 'drought'])) {
    return 'weather';
  }
  if (includesAny(text, ['market', 'demand', 'price', 'sell', 'selling', 'rate', 'mandi', 'profit', 'buyer'])) {
    return 'market_demand';
  }
  if (includesAny(text, ['storage', 'cold storage', 'harvest', 'post harvest', 'post-harvest', 'packing', 'grading', 'transport', 'shelf life'])) {
    return 'storage_post_harvest';
  }
  if (includesAny(text, ['which crop', 'what crop', 'best crop', 'recommend crop', 'crop selection', 'suitable crop', 'grow in', 'sowing', 'season'])) {
    return 'crop_recommendation';
  }

  return 'general_farming';
}

function languageInstruction(language: LanguageOption) {
  const nativeName = LANGUAGE_NATIVE_NAMES[language.name] || language.name;
  return `${language.name} (${nativeName}), locale code ${language.code}`;
}

function buildClarification(language: LanguageOption, hasImage: boolean) {
  if (hasImage) {
    return LOCALIZED_IMAGE_CLARIFICATION[language.name] || LOCALIZED_IMAGE_CLARIFICATION.English;
  }

  return LOCALIZED_CLARIFICATION[language.name] || LOCALIZED_CLARIFICATION.English;
}

function buildAgricultureFallback(userInput: string, hasImage: boolean, intent: FarmingIntent, language: LanguageOption) {
  const inputSummary = userInput.trim()
    ? `the question: "${userInput.trim()}"`
    : hasImage
      ? 'the uploaded crop or farm image'
      : 'the current farming input';
  const intentLabel = INTENT_LABELS[intent];
  const nativeName = LANGUAGE_NATIVE_NAMES[language.name] || language.name;

  const englishFallback = `**Problem / Observation**: The exact ${intentLabel} issue is not fully clear from ${inputSummary}.
**Likely Reason**: The cause may depend on crop variety, crop age, local weather, soil condition, recent irrigation, fertilizer use, pest presence, or visible field symptoms.
**Suggested Action**: Please share the crop name, crop age/growth stage, location, and clear symptom details. If an image is involved, send a close-up of the affected leaf/fruit/stem/soil and one wider plant photo. Until confirmed, inspect 4-5 spots in the field, keep irrigation balanced, and isolate or remove severely affected plant parts only if disease is visibly spreading.
**Precaution**: Do not spray strong pesticides or apply high fertilizer doses until the cause is identified. Follow label dosage, wear protection while spraying, and consult a local agriculture officer for severe or fast-spreading symptoms.`;

  if (language.name === 'English') return englishFallback;

  const localizedClarification = hasImage
    ? LOCALIZED_IMAGE_CLARIFICATION[language.name]
    : LOCALIZED_CLARIFICATION[language.name];

  return localizedClarification || `${language.name} (${nativeName}): ${englishFallback}`;
}

export default function AIAssistant() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Namaste! I am your advanced AgriEasy AI Guide. I can analyze crop photos, listen to your voice, and answer all your farming questions in your preferred language. How can I help you today?',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState(INDIAN_LANGUAGES[0]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageMimeType, setSelectedImageMimeType] = useState<string>('image/jpeg');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const { location: globalLocation } = useLocationContext();

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserProfile(data);
          const savedLang = INDIAN_LANGUAGES.find(l => l.name === data.language);
          if (savedLang) setLanguage(savedLang);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      stopCamera();
      window.speechSynthesis.cancel();
    };
  }, []);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        // Auto-send voice queries
        if (transcript.length > 5) {
          handleSend(transcript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error('Voice input failed. Try speaking slowly.');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [language]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (!recognitionRef.current) {
        toast.error('Voice input not supported in this browser.');
        return;
      }
      recognitionRef.current.lang = language.code;
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopCamera = () => {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const openCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraInputRef.current?.click();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      cameraStreamRef.current = stream;
      setIsCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {
            toast.error('Camera preview could not start. Please upload an image instead.');
            cameraInputRef.current?.click();
          });
        }
      }, 0);
    } catch (error) {
      console.error('Camera access error:', error);
      toast.info('Camera access is unavailable. Opening photo upload instead.');
      cameraInputRef.current?.click();
    }
  };

  const captureCameraImage = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      toast.error('Camera is not ready yet. Please try again.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const image = canvas.toDataURL('image/jpeg', 0.88);
    setSelectedImage(image);
    setSelectedImageMimeType('image/jpeg');
    stopCamera();
    toast.success('Photo captured. Ask your crop question or tap send.');
  };

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set language
    utterance.lang = language.code;
    
    // Detailed voice selection
    const voices = window.speechSynthesis.getVoices();
    
    // Priority 1: Exact language match (e.g., hi-IN)
    // Priority 2: Language family match (e.g., hi)
    // Priority 3: Fallback to first available voice
    const exactMatch = voices.find(v => v.lang === language.code);
    const indiaFamilyMatch = voices.find(v => v.lang.startsWith(language.code.split('-')[0]) && v.lang.toUpperCase().includes('IN'));
    const familyMatch = voices.find(v => v.lang.startsWith(language.code.split('-')[0]));
    
    if (exactMatch) {
      utterance.voice = exactMatch;
    } else if (indiaFamilyMatch) {
      utterance.voice = indiaFamilyMatch;
    } else if (familyMatch) {
      utterance.voice = familyMatch;
    }
    
    // Tuning for clarity
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1;

    console.info('[AgriEasy AI][TTS]', {
      selectedLanguage: language.name,
      languageCode: language.code,
      selectedVoice: utterance.voice?.name || 'browser default',
      selectedVoiceLang: utterance.voice?.lang || utterance.lang,
    });
    
    window.speechSynthesis.speak(utterance);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid crop or farm image.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image too large. Please use an image under 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setSelectedImageMimeType(file.type || 'image/jpeg');
        toast.success("Image added. Now ask your crop question or tap send.");
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if ((!textToSend.trim() && !selectedImage) || isLoading) return;
    const currentInput = textToSend.trim();
    const currentImage = selectedImage;
    const currentImageMimeType = selectedImageMimeType;
    const farmingIntent = detectFarmingIntent(currentInput, Boolean(currentImage));

    console.info('[AgriEasy AI][input]', {
      selectedLanguage: language.name,
      languageCode: language.code,
      inputMode: currentImage && currentInput ? 'text plus image' : currentImage ? 'image' : overrideInput ? 'voice' : 'text',
      detectedIntent: farmingIntent,
      hasImage: Boolean(currentImage),
      question: currentInput,
    });

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: currentInput,
      image: currentImage || undefined,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    
    setInput('');
    setSelectedImage(null);
    setSelectedImageMimeType('image/jpeg');
    setIsLoading(true);

    const userLocContext = userProfile?.location?.district 
      ? `Location: ${userProfile.location.district}, ${userProfile.location.state}`
      : `Location: ${globalLocation.locality || globalLocation.city}, ${globalLocation.district}, ${globalLocation.state}`;
    const recentChatContext = messages
      .slice(-6)
      .map((msg) => `${msg.role === 'user' ? 'Farmer' : 'Assistant'}: ${msg.content}${msg.image ? ' [image attached]' : ''}`)
      .join('\n');
    const inputMode = currentImage && currentInput.trim()
      ? 'text plus image'
      : currentImage
        ? 'image'
        : overrideInput
          ? 'voice'
          : 'text';

    try {
      const promptParts: any[] = [];
      
      if (currentImage) {
        const base64Data = currentImage.split(',')[1];
        promptParts.push({
          inlineData: {
            data: base64Data,
            mimeType: currentImageMimeType || currentImage.match(/^data:(.*?);/)?.[1] || "image/jpeg"
          }
        });
      }

      promptParts.push({
        text: `The user's selected output language is ${languageInstruction(language)}.
        The final answer shown to the farmer must be written only in ${language.name}. Do not default to English unless English is selected.
        User Context: ${userLocContext}.
        Input mode: ${inputMode}.
        Detected agriculture intent: ${INTENT_LABELS[farmingIntent]}.
        Recent conversation:
        ${recentChatContext || 'No previous farming context.'}
        Current user query: "${currentInput || "Examine this agriculture image and advise on crop, plant, soil, pest, disease, or produce condition."}"
        ${currentImage ? 'An image is attached. Base the answer on visible agricultural evidence from the image and the text query, if provided.' : 'No image is attached. Base the answer on the text or voice query.'}`
      });

      console.info('[AgriEasy AI][request]', {
        selectedLanguage: language.name,
        languageCode: language.code,
        languageInstruction: languageInstruction(language),
        inputMode,
        detectedIntent: farmingIntent,
        hasImage: Boolean(currentImage),
      });

      const response = await ai.models.generateContent({
        model: MODELS.flash,
        contents: promptParts,
        config: {
          systemInstruction: `You are the AgriEasy Platinum Expert, a world-class agricultural scientist for Indian farmers. 
          STRICT RULES:
          1. Your final answer MUST be in ${languageInstruction(language)} only. Do not default to English, do not mix English labels, and do not translate only part of the answer unless the farmer selected English.
          2. Answer like a natural, helpful ChatGPT-quality farming expert: clear, practical, conversational, specific, and easy for a farmer to act on.
          3. Answer the farmer's actual current query. Do not give a generic template unrelated to the user's question, voice transcript, or image.
          4. First classify the user's intent as: ${INTENT_LABELS[farmingIntent]}. Your answer must stay on that intent unless the image clearly proves a more specific agriculture issue.
          5. Stay strictly within agriculture and farming: crop selection, growth stages, pest attack, plant disease, fertilizer, pesticide, irrigation, weather decisions, demand/market, cold storage, post-harvest, soil, livestock feed, and farm operations.
          6. If the query is clearly non-agricultural, politely say in ${language.name} that you can help only with farming and ask for a farming question.
          7. Use this structure only when diagnosing a crop/plant/soil/pest/disease/produce issue, and translate the headings into ${language.name}:
             - **Problem / Observation**: [Specific symptom or visual observation from the actual input]
             - **Likely Reason**: [Crop-specific possible causes, not app/network reasons]
             - **Suggested Action**: [Practical Indian farming steps, safe organic or chemical guidance when appropriate]
             - **Precaution**: [Dosage/safety/when to consult local expert]
          8. For market, weather, cold storage, irrigation, crop planning, or general farming questions, answer directly and practically. Use headings only if they help; do not force disease diagnosis headings when not relevant.
          9. If an image is provided, analyze visible agricultural content only: crop disease, pest attack, leaf damage, fruit/vegetable condition, plant health, soil condition, or crop observation. If the image is unclear, say what is unclear and ask for a closer photo.
          10. If the question lacks necessary detail, ask one short relevant clarification question in ${language.name} instead of guessing.
          11. Use available context: selected language, user location, recent conversation, text/voice input, and uploaded image.
          12. Never mention technical connectivity, server delay, network fluctuation, API failure, or app issues unless the user explicitly asks about those topics.
          13. If uncertain, clearly say the diagnosis is uncertain in agriculture terms and provide safe next steps. Do not invent exact pesticide names without enough evidence.`,
        }
      });

      const rawAIResponse = response.text?.trim() || '';
      const assistantContent = rawAIResponse || buildAgricultureFallback(currentInput, Boolean(currentImage), farmingIntent, language);

      console.info('[AgriEasy AI][response]', {
        selectedLanguage: language.name,
        languageCode: language.code,
        rawAIResponse,
        finalDisplayedResponse: assistantContent,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      // Auto-speak the response for accessibility
      if (assistantContent.length < 500) {
        speak(assistantContent);
      }
    } catch (error) {
      console.error('AI Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: buildAgricultureFallback(currentInput, Boolean(currentImage), farmingIntent, language),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout title="Agri AI Expert">
      <div className="flex flex-col h-[calc(100vh-140px)] max-w-2xl mx-auto px-4 md:px-0">
        <div className="relative mb-4 min-h-[128px] overflow-hidden rounded-[28px] bg-emerald-900 p-5 text-white shadow-sm">
          <SafeImage src={moduleImages.aiAssistant} alt="AI assisted farming support" className="absolute inset-0 h-full w-full opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-900/75 to-emerald-900/20" />
          <div className="relative flex h-full items-end">
            <div>
              <Badge className="mb-2 bg-white/15 text-white border-none backdrop-blur">AI crop support</Badge>
              <h1 className="text-2xl font-black">Ask about crops, pests, soil, and weather</h1>
              <p className="mt-1 max-w-lg text-xs leading-5 text-emerald-50">Upload a crop photo or use voice input for practical farm guidance.</p>
            </div>
          </div>
        </div>

        {/* Advanced Header & Navigation */}
        <div className="flex flex-col gap-3 mb-4 bg-white/80 backdrop-blur-md p-4 rounded-[32px] shadow-sm border border-emerald-50 sticky top-0 z-10 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate(-1)}
                className="h-9 w-9 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                  <Bot className="text-white h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 text-sm leading-tight flex items-center gap-1">
                    AI Specialist
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </h2>
                  <span className="text-[10px] text-slate-500 font-medium">Ask in {language.name}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-2xl p-1 border border-slate-100 flex items-center gap-2">
              <Languages className="h-3.5 w-3.5 text-slate-400 ml-2" />
              <Select 
                value={language.name} 
                onValueChange={(val) => {
                  const lang = INDIAN_LANGUAGES.find(l => l.name === val);
                  if (lang) {
                    setLanguage(lang);
                    toast.success(`Language set to ${lang.name}`);
                  }
                }}
              >
                <SelectTrigger className="h-8 w-[130px] border-none bg-transparent text-slate-600 text-xs font-bold rounded-xl focus:ring-0">
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-emerald-100">
                  {INDIAN_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.name} value={lang.name} className="text-xs rounded-lg">
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {['Crop Health', 'Pest Control', 'Market Prices', 'Fertilizers'].map(tag => (
              <Badge 
                key={tag} 
                variant="outline" 
                className="bg-emerald-50/50 text-[10px] text-emerald-800 border-emerald-100 whitespace-nowrap cursor-pointer hover:bg-emerald-100"
                onClick={() => setInput(`Give me advice on ${tag}`)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Dynamic Chat Pane */}
        <ScrollArea className="flex-1 pr-2 mb-4">
          <div className="space-y-6 pt-2 pb-6">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                      msg.role === 'user' ? 'bg-emerald-600' : 'bg-white border border-slate-100'
                    }`}>
                      {msg.role === 'user' ? <User className="h-5 w-5 text-white" /> : <Bot className="h-5 w-5 text-emerald-600" />}
                    </div>
                    
                    <div className={`space-y-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`p-4 rounded-[28px] shadow-sm relative group overflow-hidden ${
                          msg.role === 'user'
                            ? 'bg-emerald-600 text-white rounded-tr-none'
                            : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                        }`}
                      >
                        {msg.image && (
                          <div className="mb-4 -mx-1 -mt-1 group cursor-pointer overflow-hidden rounded-[20px] border-2 border-white shadow-xl bg-slate-100">
                            <img src={msg.image} alt="Crop Scan" className="w-full max-h-72 object-cover transition-transform group-hover:scale-105" />
                          </div>
                        )}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</p>
                        
                        <div className={`flex items-center justify-between gap-4 mt-3 pt-3 border-t ${
                          msg.role === 'user' ? 'border-white/10' : 'border-slate-50'
                        }`}>
                          <span className="text-[10px] opacity-60 font-bold uppercase tracking-wider">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {msg.role === 'assistant' && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => speak(msg.content)}
                                className="h-7 w-7 flex items-center justify-center bg-emerald-50 rounded-full text-emerald-600 hover:bg-emerald-100"
                              >
                                <Volume2 className="h-4 w-4" />
                              </button>
                              <button className="h-7 w-7 flex items-center justify-center bg-slate-50 rounded-full text-slate-400 hover:text-emerald-600">
                                <RefreshCw className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <div className="flex justify-start gap-3">
                <div className="w-9 h-9 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shrink-0">
                  <Bot className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="bg-white p-5 rounded-[28px] rounded-tl-none border border-emerald-50 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    AI is analyzing...
                  </div>
                  <div className="flex gap-1.5">
                    <motion.div animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-emerald-400 rounded-full" />
                    <motion.div animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-emerald-400 rounded-full" />
                    <motion.div animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-emerald-400 rounded-full" />
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Multimedia Input Console */}
        <div className="relative z-10 px-2 pb-4">
          {isCameraOpen && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-4 mb-4 overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-2xl"
            >
              <div className="relative bg-slate-950">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-64 w-full object-cover"
                />
                <div className="absolute left-3 top-3 rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-lg">
                  Camera ready
                </div>
              </div>
              <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-tight text-emerald-800">Capture crop photo</p>
                  <p className="text-[10px] text-slate-500">Use for leaves, pests, soil, fruit, vegetables, or plant health.</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="rounded-2xl border-slate-200 text-slate-600"
                    onClick={() => {
                      stopCamera();
                      cameraInputRef.current?.click();
                    }}
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-2xl border-rose-100 text-rose-600 hover:bg-rose-50"
                    onClick={stopCamera}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Close
                  </Button>
                  <Button
                    className="rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={captureCameraImage}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Capture
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {selectedImage && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="mx-4 mb-4 p-3 bg-white/90 backdrop-blur-xl border border-emerald-100 rounded-[28px] shadow-2xl flex items-center gap-4"
            >
              <div className="relative group overflow-hidden rounded-2xl border-2 border-emerald-200">
                <img src={selectedImage} alt="Analysis Target" className="h-16 w-16 object-cover" />
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-tighter">Image Attached</p>
                <p className="text-[10px] text-slate-500">Ready for agricultural detection</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setSelectedImage(null)} className="h-8 w-8 rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          <div className="bg-white rounded-[36px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 p-2.5 transition-all focus-within:shadow-emerald-100/50 focus-within:border-emerald-200">
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-50 rounded-[24px] p-1 gap-1">
                {/* Direct Camera Access */}
                <input 
                  type="file" 
                  hidden 
                  ref={cameraInputRef} 
                  accept="image/*" 
                  capture="environment" 
                  onChange={handleImageSelect} 
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-11 w-11 rounded-[20px] text-slate-600 hover:bg-white hover:text-emerald-600 hover:shadow-sm"
                  onClick={openCamera}
                  title="Open camera"
                  aria-label="Open camera for crop photo"
                >
                  <Camera className="h-6 w-6" />
                </Button>
                
                {/* Gallery Upload */}
                <input 
                  type="file" 
                  hidden 
                  ref={fileInputRef} 
                  accept="image/*" 
                  onChange={handleImageSelect} 
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-11 w-11 rounded-[20px] text-slate-600 hover:bg-white hover:text-emerald-600 hover:shadow-sm"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload from gallery"
                  aria-label="Upload crop image from gallery"
                >
                  <ImageIcon className="h-6 w-6" />
                </Button>

                {/* Voice Input */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`h-11 w-11 rounded-[20px] transition-all relative ${
                    isListening ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'text-slate-600 hover:bg-white hover:text-emerald-600'
                  }`}
                  onClick={toggleListening}
                  title="Voice command"
                  aria-label="Start voice input"
                >
                  {isListening ? (
                    <>
                      <MicOff className="h-6 w-6" />
                      <div className="absolute inset-0 rounded-full border-2 border-rose-500 animate-ping opacity-20" />
                    </>
                  ) : <Mic className="h-6 w-6" />}
                </Button>
              </div>

              <div className="flex-1 px-3">
                <Input
                  placeholder={isListening ? "Listening deeply..." : "Ask your Agri Guide anything..."}
                  value={input}
                  disabled={isListening}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="border-none focus-visible:ring-0 shadow-none text-sm placeholder:text-slate-400 bg-transparent p-0 h-auto font-medium"
                />
              </div>

              <Button 
                onClick={() => handleSend()} 
                disabled={isLoading || (!input.trim() && !selectedImage)}
                className="bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-[24px] h-12 w-12 p-0 shadow-lg shadow-emerald-200 shrink-0 transition-transform active:scale-95"
              >
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
