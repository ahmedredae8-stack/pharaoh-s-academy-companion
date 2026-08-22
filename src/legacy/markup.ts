// Legacy markup extracted verbatim from the original single-file app.
/* eslint-disable */
export const APP_HTML = `
    <!-- Background layers removed: the Duo skin provides the light theme -->

    <!-- Main App Container -->
    <div id="app-container" class="relative w-full h-screen overflow-hidden flex justify-center items-center">

        <!-- 1. Loading Screen -->
        <div id="loading-screen" class="screen active flex-col items-center justify-center w-full h-full z-50 bg-[#020408]">
            <div class="relative w-32 h-32 mb-8">
                <div class="absolute inset-0 border-4 border-cyber-gold rounded-full animate-ping opacity-20"></div>
                <div class="absolute inset-0 border-4 border-t-transparent border-cyber-gold rounded-full animate-spin"></div>
                <div class="absolute inset-4 bg-cyber-gold rounded-full opacity-10 animate-pulse"></div>
                <img src="/mascot.png" alt="تميم تميمة فرعون Ai" class="absolute inset-0 w-full h-full object-contain p-4 drop-shadow-[0_0_14px_rgba(255,215,0,0.6)] animate-pulse" />
            </div>
            <p class="text-cyber-blue font-mono text-sm tracking-widest animate-pulse">INITIALIZING SYSTEM...</p>
            <p class="text-cyber-gold font-bold mt-2 text-lg text-glow">جاري تفعيل بروتوكول فرعون</p>
        </div>

        <!-- 2. Splash Screen -->
        <div id="splash-screen" class="screen flex-col items-center justify-center w-full h-full text-center p-6 z-40">
            <div class="glass-panel p-10 md:p-16 flex flex-col items-center max-w-2xl w-full animate-float border-t border-cyber-gold/30">
                <div class="w-44 h-44 mb-6 relative">
                    <div class="absolute inset-0 bg-cyber-gold blur-2xl opacity-25 rounded-full"></div>
                    <img src="/mascot.png" alt="تميمة فرعون Ai: قط فرعوني لطيف" class="relative z-10 w-full h-full object-contain drop-shadow-lg" />
                </div>
                
                <h1 class="font-black text-5xl md:text-7xl text-white mb-2 tracking-tighter">
                    <span class="text-cyber-gold text-glow">Pharaoh</span> Ai
                </h1>
                <div class="h-0.5 w-24 bg-gradient-to-r from-transparent via-cyber-blue to-transparent mb-4"></div>
                <p class="text-xl md:text-2xl text-red-500 font-bold tracking-wide text-glow-red uppercase">Cybersecurity Adventure</p>
                <p class="text-gray-400 mt-6 text-sm md:text-base max-w-md leading-relaxed">
                    نظام الدفاع الأخير عن المملكة الرقمية. هل تملك الشجاعة لحماية البيانات المقدسة؟
                </p>
            </div>
        </div>

        <!-- 3. Intro Chat Screen -->
        <div id="intro-chat-screen" class="screen flex-col w-full h-full max-w-4xl mx-auto glass-panel border-x border-y-0 rounded-none md:rounded-xl md:my-4 md:h-[95vh] overflow-hidden">
            <div class="bg-black/40 p-4 border-b border-white/10 backdrop-blur flex items-center justify-between sticky top-0 z-20">
                <div class="flex items-center gap-3">
                    <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <h2 class="text-cyber-gold font-bold text-lg tracking-wide">قناة اتصال مشفرة</h2>
                </div>
                <span class="text-xs font-mono text-cyber-blue opacity-70">SECURE_CHANNEL_V.1.0</span>
            </div>

            <!-- Increased padding on mobile for better spacing -->
            <div id="intro-chat-messages" class="flex-grow flex flex-col space-y-6 p-4 md:p-6 overflow-y-auto custom-scrollbar pb-32">
                <!-- Messages -->
            </div>

            <div id="intro-chat-actions" class="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black/90 to-transparent z-30 hidden text-center">
                <button id="start-learning-btn" class="btn-cyber w-full md:w-auto px-12 py-4 text-xl font-bold rounded-lg">
                    <span class="relative z-10 flex items-center justify-center gap-2">
                        أنا مستعد للمهمة
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
                    </span>
                </button>
            </div>
        </div>

        <!-- 4. Path Selection Screen -->
        <div id="path-selection-screen" class="screen flex-col items-center justify-start w-full h-full p-6 md:p-8 overflow-y-auto">
            <div class="max-w-5xl w-full">
                <h2 class="text-4xl md:text-5xl font-black text-center text-white mb-2 text-glow">مسار المحارب</h2>
                <p class="text-center text-gray-400 mb-10">اختر مستوى التصريح الأمني للبدء</p>
                
                <!-- Increased gap to 6 on mobile -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                    <button data-path="beginner" class="path-btn group glass-panel p-6 hover:bg-white/5 transition-all duration-300 border-l-4 border-l-cyber-gold text-right relative overflow-hidden">
                        <div class="absolute top-0 left-0 w-full h-full bg-gradient-to-l from-cyber-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div class="relative z-10">
                            <span class="text-xs font-mono text-cyber-gold mb-2 block">LEVEL 01</span>
                            <h3 class="text-2xl font-bold text-white group-hover:text-cyber-gold transition-colors mb-2">الحارس المبتدئ</h3>
                            <p class="text-sm text-gray-400 leading-relaxed">تأسيس القواعد الأساسية. فهم العدو وبناء الجدران الأولى.</p>
                            <div class="mt-4 flex items-center text-cyber-gold text-sm font-bold">
                                ابدأ البروتوكول
                                <svg class="w-4 h-4 mr-2 transform group-hover:-translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                            </div>
                        </div>
                    </button>

                    <button data-path="intermediate" class="path-btn group glass-panel p-6 hover:bg-white/5 transition-all duration-300 border-l-4 border-l-cyber-blue text-right relative overflow-hidden disabled:opacity-40 disabled:grayscale">
                        <div class="absolute top-0 left-0 w-full h-full bg-gradient-to-l from-cyber-blue/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div class="relative z-10">
                            <span class="text-xs font-mono text-cyber-blue mb-2 block">LEVEL 02</span>
                            <h3 class="text-2xl font-bold text-white group-hover:text-cyber-blue transition-colors mb-2">الخبير التكتيكي</h3>
                            <p class="text-sm text-gray-400 leading-relaxed">تحليل الشبكات، التشفير، والتعمق في البنية التحتية.</p>
                             <div class="mt-4 flex items-center text-cyber-blue text-sm font-bold">
                                 <span class="lock-icon">🔒 مغلق حالياً</span>
                             </div>
                        </div>
                    </button>

                    <button data-path="upperIntermediate" class="path-btn group glass-panel p-6 hover:bg-white/5 transition-all duration-300 border-l-4 border-l-red-500 text-right relative overflow-hidden disabled:opacity-40 disabled:grayscale">
                        <div class="absolute top-0 left-0 w-full h-full bg-gradient-to-l from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div class="relative z-10">
                            <span class="text-xs font-mono text-red-500 mb-2 block">LEVEL 03</span>
                            <h3 class="text-2xl font-bold text-white group-hover:text-red-500 transition-colors mb-2">نخبة الظل</h3>
                            <p class="text-sm text-gray-400 leading-relaxed">الهجوم المضاد، الهندسة الاجتماعية، وإدارة الكوارث.</p>
                             <div class="mt-4 flex items-center text-red-500 text-sm font-bold">
                                 <span class="lock-icon">🔒 مغلق حالياً</span>
                             </div>
                        </div>
                    </button>
                    
                    <button data-path="advanced" class="path-btn group glass-panel p-6 hover:bg-white/5 transition-all duration-300 border-l-4 border-l-purple-500 text-right relative overflow-hidden disabled:opacity-40 disabled:grayscale col-span-1 md:col-span-3">
                        <div class="absolute top-0 left-0 w-full h-full bg-gradient-to-l from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div class="relative z-10 flex flex-col md:flex-row justify-between items-center">
                            <div>
                                <span class="text-xs font-mono text-purple-500 mb-2 block">LEVEL 04 - FINAL</span>
                                <h3 class="text-2xl font-bold text-white group-hover:text-purple-500 transition-colors mb-2">قائد الفيلق الرقمي</h3>
                                <p class="text-sm text-gray-400 leading-relaxed">القيادة، استراتيجيات الـ Cloud، الذكاء الاصطناعي، وإدارة الفرق.</p>
                             </div>
                             <div class="mt-4 flex items-center text-purple-500 text-sm font-bold">
                                 <span class="lock-icon">🔒 مغلق حالياً</span>
                             </div>
                        </div>
                    </button>
                </div>
            </div>
        </div>

        <!-- 5. Lesson List Screen -->
        <div id="lesson-list-screen" class="screen flex-col w-full h-full max-w-6xl mx-auto md:p-6">
            <div class="flex-col w-full h-full glass-panel overflow-hidden flex rounded-none md:rounded-2xl">
                <div class="flex-shrink-0 p-5 border-b border-white/10 bg-black/40 flex justify-between items-center backdrop-blur-xl z-20">
                    <div>
                        <h2 id="path-title" class="font-bold text-2xl text-cyber-gold text-glow"></h2>
                        <p class="text-xs text-gray-400 font-mono mt-1">اختر المهمة للمتابعة</p>
                    </div>
                    <button id="back-to-paths-btn" class="btn-cyber px-4 py-2 text-sm rounded flex items-center gap-2">
                        <span>العودة</span>
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </button>
                </div>
                <!-- Increased padding and gap for better spacing on mobile -->
                <div id="lesson-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4 md:p-8 overflow-y-auto flex-grow custom-scrollbar">
                    <!-- Lessons injected here -->
                </div>
            </div>
        </div>

        <!-- 6. Lesson View Screen (Dialogue / Application / Summary) -->
        <div id="lesson-view-screen" class="screen flex-col w-full h-full max-w-4xl mx-auto md:p-4">
            <div class="flex-col w-full h-full glass-panel overflow-hidden flex rounded-none md:rounded-2xl relative">
                
                <!-- Speaker Bar / Stage Title -->
                <div id="lesson-header-bar" class="flex items-center p-4 border-b border-white/10 bg-gradient-to-r from-black/80 to-transparent backdrop-blur-md z-20 transition-all duration-300 min-h-[90px]">
                    <!-- Dynamic Speaker Info or Stage Title -->
                </div>

                <!-- Dialogue / Application / Summary Content Area -->
                <div id="lesson-content-area" class="flex-grow flex flex-col space-y-6 p-4 md:p-8 overflow-y-auto custom-scrollbar relative">
                    <!-- Dynamic content goes here (Bubbles, Application Story, Summary) -->
                </div>

                <!-- Flow Control Area -->
                <div id="flow-control-area" class="sticky bottom-0 left-0 w-full p-4 bg-black/90 border-t border-white/10 backdrop-blur z-30 flex flex-col gap-2">
                    
                    <!-- Tap Indicator (Only for dialogue mode) -->
                    <div id="tap-indicator" class="p-1 text-center bg-black/40 border border-white/5 rounded backdrop-blur text-gray-400 text-xs md:text-sm cursor-pointer hover:text-white transition-colors flex items-center justify-center gap-2 animate-pulse hidden">
                        <span class="w-2 h-2 bg-cyber-gold rounded-full"></span>
                        اضغط في أي مكان للمتابعة
                    </div>
                    
                    <!-- Dynamic Action Button (For stage changes) -->
                    <button id="next-stage-btn" class="btn-cyber w-full py-3 text-lg font-bold rounded-lg hidden">
                        <span class="relative z-10 flex items-center justify-center gap-2" id="next-stage-text">
                            <!-- Button text updated by JS -->
                        </span>
                    </button>
                </div>
            </div>
        </div>

        <!-- 7. Practical Lab Screen (EXISTING) -->
        <div id="practical-screen" class="screen flex-col items-center justify-center w-full h-full p-4 md:p-6 bg-[#020408]">
            <div class="glass-panel w-full max-w-5xl h-[90vh] flex flex-col relative overflow-hidden border-cyber-blue/30 shadow-[0_0_50px_rgba(0,240,255,0.1)]">
                <!-- Lab Header -->
                <div class="p-4 border-b border-white/10 bg-black/60 flex justify-between items-center">
                    <div class="flex items-center gap-3">
                        <div class="w-3 h-3 bg-cyber-blue rounded-full animate-pulse shadow-[0_0_10px_#00F0FF]"></div>
                        <h2 class="font-mono text-cyber-blue text-lg tracking-widest">LAB_ENVIRONMENT_V.2.0</h2>
                    </div>
                    <div class="text-xs text-gray-500 font-mono" id="lab-id-display">SESSION: #001</div>
                </div>

                <!-- Lab Content Container -->
                <div class="flex-grow relative flex flex-col md:flex-row overflow-hidden">
                    <!-- Instructions Sidebar (Conditional Visibility) -->
                    <div id="lab-instructions-sidebar" class="w-full md:w-1/3 bg-black/40 border-l border-white/5 p-6 overflow-y-auto instructions-hidden md:instructions-visible">
                        <h3 id="lab-title" class="text-2xl font-bold text-white mb-2 text-glow-blue"></h3>
                        <p id="lab-desc" class="text-gray-400 text-sm leading-relaxed mb-6"></p>
                        
                        <div class="bg-cyber-blue/5 border border-cyber-blue/20 p-4 rounded mb-4">
                            <h4 class="text-cyber-blue text-xs font-bold mb-2 uppercase">Mission Objective</h4>
                            <ul id="lab-steps" class="text-gray-300 text-sm space-y-2 list-disc list-inside"></ul>
                        </div>

                        <div id="lab-feedback" class="hidden p-4 rounded border text-sm font-bold text-center animate-pulse"></div>
                    </div>

                    <!-- Workspace (Visual Simulation) -->
                    <div id="lab-workspace" class="flex-grow bg-[#050810] relative flex items-center justify-center overflow-hidden">
                        <!-- Dynamic Content Injected Here -->
                        <div class="absolute inset-0 cyber-grid opacity-20"></div>
                    </div>
                </div>

                <!-- Footer Actions -->
                <div class="p-4 border-t border-white/10 bg-black/60 flex justify-between gap-2">
                    <button id="toggle-instructions-btn" class="btn-cyber px-4 py-2 text-sm">
                        إظهار/إخفاء التعليمات
                    </button>
                    <div class="flex gap-2">
                         <button id="skip-lab-btn" class="btn-cyber px-4 py-2 text-sm bg-gray-700/50 hidden">
                             تخطي المحاكي
                         </button>
                         <button id="complete-lab-btn" class="btn-cyber px-8 py-2 opacity-50 cursor-not-allowed" disabled>
                             اكتمال المهمة والمتابعة
                         </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 9. Quiz Screen (EXISTING) -->
        <div id="quiz-screen" class="screen flex-col items-center justify-center w-full h-full p-4">
            <div class="glass-panel max-w-3xl w-full p-6 md:p-10 relative">
                 <h2 class="font-bold text-cyber-gold text-center mb-8 text-3xl text-glow">اختبار المصادقة</h2>
                 
                 <div class="w-full">
                    <p id="quiz-question" class="text-center mb-10 text-xl md:text-2xl font-medium text-white leading-relaxed"></p>
                    
                    <div id="quiz-options" class="grid grid-cols-1 gap-4">
                        <!-- Options -->
                    </div>
                    
                    <div id="quiz-feedback" class="text-center text-lg mt-6 min-h-[2rem]"></div>
                    
                    <button id="next-question-btn" class="btn-cyber mt-8 w-full max-w-xs mx-auto hidden py-3 px-6 rounded">
                        المتابعة
                    </button>
                 </div>
            </div>
        </div>

    </div>

    <!-- 10. Settings Modal (Modified) -->
    <div id="settings-modal" class="settings-overlay">
        <div class="glass-panel modal-content max-w-xl w-full p-8 relative">
            <h2 class="text-3xl font-bold text-cyber-blue mb-6 border-b border-white/10 pb-2">إعدادات النظام</h2>
            
            <button id="close-settings-btn" class="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>

            <div class="space-y-6">
                <!-- Intro Skip Control -->
                <div class="p-4 bg-black/40 rounded-lg border border-gray-700 flex justify-between items-center">
                    <div>
                        <h3 class="font-bold text-lg text-white">تخطي المقدمة (Startup)</h3>
                        <p class="text-sm text-gray-400">الانتقال مباشرة إلى اختيار المسار عند بدء التشغيل.</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="skip-intro-toggle" class="sr-only peer">
                        <div class="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyber-blue rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyber-blue"></div>
                    </label>
                </div>
                
                <!-- Reset Progress -->
                <div class="p-4 bg-red-900/20 rounded-lg border border-red-700/50 text-center">
                    <button id="reset-app-btn" class="btn-cyber bg-red-800/50 hover:bg-red-700 text-red-400 font-bold px-6 py-2">
                        مسح التقدم وإعادة التشغيل (خطر!)
                    </button>
                </div>
                
                <!-- Lesson Skip Count Display (New) -->
                <div class="p-4 bg-black/40 rounded-lg border border-gray-700">
                    <h3 class="font-bold text-lg text-white mb-2">عدد مرات تجاوز الدروس</h3>
                    <p class="text-sm text-gray-400 mb-1">تجاوز الدروس بالضغط على القفل متاح لـ 3 مرات فقط.</p>
                    <p id="skip-count-display" class="text-xl font-mono text-cyber-gold text-center">0 / 3</p>
                </div>

            </div>
        </div>
    </div>
    
    <!-- 11. Custom Confirmation Modal for Skipping Lesson (New) -->
    <div id="lesson-skip-modal" class="settings-overlay">
        <div class="glass-panel modal-content max-w-sm w-full p-6 relative text-center">
            <h3 class="text-xl font-bold text-cyber-gold mb-4">تأكيد تجاوز المهمة</h3>
            <p id="skip-message" class="text-gray-300 mb-6">هل تريد البدء مباشرة من الدرس (الدرس الثالث مثلاً)؟</p>
            <p class="text-sm text-red-400 mb-4">سيتم استخدام إحدى محاولاتك (المتبقي: <span id="remaining-skips"></span>)</p>
            <div class="flex justify-center gap-4">
                <button id="confirm-skip-btn" class="btn-cyber px-6 py-2 bg-green-800/50 hover:bg-green-700">تأكيد البدء</button>
                <button id="cancel-skip-btn" class="btn-cyber px-6 py-2 bg-gray-700/50 hover:bg-gray-600">إلغاء</button>
            </div>
        </div>
    </div>

    <!-- 12. Custom Alert Modal (For Reset) -->
    <div id="custom-alert-modal" class="settings-overlay">
        <div class="glass-panel modal-content max-w-sm w-full p-6 relative text-center">
            <h3 id="alert-title" class="text-xl font-bold text-red-400 mb-4">تحذير</h3>
            <p id="alert-message" class="text-gray-300 mb-6">هل أنت متأكد من مسح جميع بيانات التقدم؟ هذا لا يمكن التراجع عنه.</p>
            <div class="flex justify-center gap-4">
                <button id="alert-confirm" class="btn-cyber px-6 py-2 bg-red-800/50 hover:bg-red-700">مسح البيانات</button>
                <button id="alert-cancel" class="btn-cyber px-6 py-2 bg-gray-700/50 hover:bg-gray-600">إلغاء</button>
            </div>
        </div>
    </div>
`;
