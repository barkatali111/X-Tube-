import React, { useState, useEffect, useRef } from 'react';
import { backend } from './services/mockBackend';
import { User, Video, ViewState } from './types';
import { generateVideoMetadata } from './services/geminiService';
import { 
  Menu, Search, Upload, Bell, User as UserIcon, LogOut, 
  Play, ThumbsUp, Share2, MoreVertical, LayoutDashboard, 
  DollarSign, Bot, ShieldCheck, PlayCircle, Eye
} from 'lucide-react';

// --- Components ---

const Sidebar = ({ isOpen, setView, activeView, user }: { isOpen: boolean, setView: (v: ViewState) => void, activeView: ViewState, user: User | null }) => {
  if (!isOpen) return null;
  
  const MenuItem = ({ view, icon: Icon, label }: any) => (
    <button 
      onClick={() => setView(view)}
      className={`flex items-center w-full p-3 mb-1 rounded-lg transition-colors ${activeView === view ? 'bg-red-600 text-white' : 'hover:bg-zinc-800 text-zinc-300'}`}
    >
      <Icon size={20} className="mr-4" />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <aside className="w-64 bg-zinc-900 h-full fixed top-16 left-0 overflow-y-auto border-r border-zinc-800 z-40 hidden md:block">
      <div className="p-4">
        <MenuItem view={ViewState.HOME} icon={PlayCircle} label="Home" />
        {user && (
          <>
            <MenuItem view={ViewState.PROFILE} icon={UserIcon} label="Your Channel" />
            <MenuItem view={ViewState.UPLOAD} icon={Upload} label="Upload Video" />
            <MenuItem view={ViewState.MONETIZATION} icon={DollarSign} label="Monetization" />
          </>
        )}
        <div className="border-t border-zinc-800 my-4 pt-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase px-3 mb-2">Explore</h3>
             {/* Dummy categories */}
             {['Trending', 'Music', 'Gaming', 'News', 'Learning'].map(cat => (
                 <div key={cat} className="px-3 py-2 text-sm text-zinc-400 hover:text-white cursor-pointer hover:bg-zinc-800 rounded">{cat}</div>
             ))}
        </div>
      </div>
    </aside>
  );
};

const Header = ({ user, setView, toggleSidebar, onSearch }: any) => {
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      onSearch(query);
  };

  return (
    <header className="h-16 bg-zinc-900/95 backdrop-blur fixed top-0 w-full z-50 flex items-center justify-between px-4 border-b border-zinc-800">
      <div className="flex items-center">
        <button onClick={toggleSidebar} className="p-2 hover:bg-zinc-800 rounded-full mr-4 text-white">
          <Menu size={24} />
        </button>
        <div onClick={() => setView(ViewState.HOME)} className="flex items-center cursor-pointer gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <Play fill="white" size={16} className="ml-1 text-white"/>
            </div>
            <span className="text-xl font-bold tracking-tighter text-white">TubeX<span className="text-xs ml-1 font-normal text-zinc-400 bg-zinc-800 px-1 rounded">PRO</span></span>
        </div>
      </div>

      <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-4 relative">
        <input 
          type="text" 
          placeholder="Search" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-700 rounded-l-full py-2 px-4 focus:outline-none focus:border-blue-500 text-zinc-200"
        />
        <button type="submit" className="bg-zinc-800 border border-l-0 border-zinc-700 rounded-r-full px-5 hover:bg-zinc-700 text-zinc-400">
          <Search size={20} />
        </button>
      </form>

      <div className="flex items-center gap-4">
        {user ? (
          <>
             <button onClick={() => setView(ViewState.UPLOAD)} className="hidden md:flex items-center gap-2 text-zinc-300 hover:text-white">
                <Upload size={24} />
             </button>
            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center cursor-pointer overflow-hidden" onClick={() => setView(ViewState.PROFILE)}>
               {user.avatar ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" /> : user.name[0]}
            </div>
          </>
        ) : (
          <button onClick={() => setView(ViewState.LOGIN)} className="flex items-center gap-2 border border-zinc-700 rounded-full px-4 py-1.5 text-blue-400 hover:bg-blue-400/10 font-medium">
            <UserIcon size={20} />
            Sign in
          </button>
        )}
      </div>
    </header>
  );
};

const VideoCard = ({ video, onClick, user }: { video: Video, onClick: () => void, user?: User }) => {
  // Mock fetching creator data
  const creator = backend.getUserById(video.userId);

  return (
    <div className="flex flex-col gap-2 cursor-pointer group" onClick={onClick}>
      <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-800">
        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
        <span className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 text-xs font-medium rounded text-white">{video.duration}</span>
      </div>
      <div className="flex gap-3 mt-1">
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-zinc-700 overflow-hidden">
            <img src={creator?.avatar} alt={creator?.name} className="w-full h-full object-cover"/>
        </div>
        <div className="flex flex-col">
          <h3 className="text-white font-semibold line-clamp-2 leading-tight group-hover:text-blue-400 transition-colors">{video.title}</h3>
          <span className="text-zinc-400 text-sm mt-1 hover:text-zinc-300">{creator?.name}</span>
          <span className="text-zinc-500 text-sm">{video.views.toLocaleString()} views • {video.uploadDate}</span>
        </div>
      </div>
    </div>
  );
};

const SecureVideoPlayer = ({ video, onEnded }: { video: Video, onEnded: () => void }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [adPlaying, setAdPlaying] = useState(false);
    const [adTimer, setAdTimer] = useState(0);

    // Simulate Mid-roll ad check
    useEffect(() => {
        const checkTime = () => {
            if (videoRef.current && !adPlaying) {
                // If video passes 10% and hasn't shown ad (simplified for demo to just random occasional)
                if (videoRef.current.currentTime > 5 && Math.random() > 0.999) {
                     triggerAd();
                }
            }
        };
        const interval = setInterval(checkTime, 1000);
        return () => clearInterval(interval);
    }, [adPlaying]);

    const triggerAd = () => {
        if (videoRef.current) {
            videoRef.current.pause();
            setAdPlaying(true);
            setAdTimer(5);
        }
    };

    useEffect(() => {
        let interval: any;
        if (adPlaying && adTimer > 0) {
            interval = setInterval(() => {
                setAdTimer(prev => prev - 1);
            }, 1000);
        } else if (adPlaying && adTimer === 0) {
            setAdPlaying(false);
            if (videoRef.current) videoRef.current.play();
        }
        return () => clearInterval(interval);
    }, [adPlaying, adTimer]);


    return (
        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl group">
             {/* Ad Overlay */}
             {adPlaying && (
                 <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center">
                     <div className="text-white text-2xl font-bold mb-4">Advertisement</div>
                     <div className="bg-yellow-500 text-black px-4 py-2 font-bold rounded">
                         Skipping in {adTimer}s
                     </div>
                     <p className="text-zinc-500 mt-4 text-sm">Monetization Active</p>
                 </div>
             )}

            <video 
                ref={videoRef}
                src={video.url} 
                className="w-full h-full"
                controls 
                controlsList="nodownload" // Prevent download button
                onContextMenu={(e) => e.preventDefault()} // Disable right click
                onEnded={onEnded}
                autoPlay
            />
            
            {/* Watermark / Brand */}
            <div className="absolute top-4 right-4 text-white/30 font-bold text-xl pointer-events-none select-none">
                TubeX
            </div>
        </div>
    );
};

// --- Pages ---

const HomePage = ({ videos, setView, setSelectedVideoId }: any) => {
    return (
        <div className="p-6 pt-6">
            <h2 className="text-xl font-bold text-white mb-4">Recommended</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                {videos.map((v: Video) => (
                    <VideoCard 
                        key={v.id} 
                        video={v} 
                        onClick={() => {
                            setSelectedVideoId(v.id);
                            setView(ViewState.WATCH);
                        }} 
                    />
                ))}
            </div>
        </div>
    );
};

const WatchPage = ({ videoId, setView, currentUser, onFollow }: any) => {
    const video = backend.getVideos().find(v => v.id === videoId);
    if (!video) return <div>Video not found</div>;

    const creator = backend.getUserById(video.userId);

    useEffect(() => {
        // Increment view on mount
        backend.incrementView(video.id);
    }, [video.id]);

    return (
        <div className="flex flex-col lg:flex-row gap-6 p-6 max-w-7xl mx-auto">
            <div className="flex-1">
                <SecureVideoPlayer video={video} onEnded={() => console.log('Video ended')} />
                
                <h1 className="text-xl md:text-2xl font-bold text-white mt-4">{video.title}</h1>
                
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mt-3 pb-4 border-b border-zinc-800 gap-4">
                    <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-zinc-700 overflow-hidden">
                            <img src={creator?.avatar} alt={creator?.name} className="w-full h-full object-cover"/>
                        </div>
                        <div>
                            <h3 className="text-white font-semibold cursor-pointer hover:text-zinc-300">{creator?.name}</h3>
                            <p className="text-xs text-zinc-400">{creator?.followers.toLocaleString()} followers</p>
                        </div>
                        <button 
                            onClick={() => creator && onFollow(creator.id)}
                            className="ml-4 bg-white text-black px-4 py-2 rounded-full font-medium hover:bg-zinc-200 transition-colors"
                        >
                            Subscribe
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                         <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white transition-colors">
                            <ThumbsUp size={18} />
                            <span>{video.likes}</span>
                         </button>
                         <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white transition-colors">
                            <Share2 size={18} />
                            <span>Share</span>
                         </button>
                    </div>
                </div>

                <div className="mt-4 bg-zinc-800/50 p-3 rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer">
                    <div className="flex gap-2 text-sm font-medium text-white mb-1">
                        <span>{video.views.toLocaleString()} views</span>
                        <span>•</span>
                        <span>{video.uploadDate}</span>
                    </div>
                    <p className="text-sm text-zinc-300 whitespace-pre-line">{video.description}</p>
                    <div className="mt-2 flex gap-2">
                        {video.tags.map(tag => (
                            <span key={tag} className="text-blue-400 text-sm">#{tag}</span>
                        ))}
                    </div>
                </div>

                 {/* Comments Placeholder */}
                 <div className="mt-6">
                    <h3 className="text-lg font-bold text-white mb-4">Comments</h3>
                    <div className="flex gap-4 mb-6">
                         <div className="w-10 h-10 rounded-full bg-zinc-700 flex-shrink-0">
                             {currentUser && <img src={currentUser.avatar} className="w-full h-full rounded-full"/>}
                         </div>
                         <div className="flex-1">
                             <input type="text" placeholder="Add a comment..." className="w-full bg-transparent border-b border-zinc-700 pb-2 focus:border-white focus:outline-none text-white text-sm" />
                         </div>
                    </div>
                 </div>
            </div>
            
            {/* Sidebar / Ads */}
            <div className="w-full lg:w-[350px] flex flex-col gap-4">
                 {/* Ad Placeholder */}
                 <div className="w-full h-64 bg-zinc-800 border border-zinc-700 flex flex-col items-center justify-center relative overflow-hidden group">
                      <div className="absolute top-2 left-2 text-[10px] bg-zinc-600 text-white px-1 rounded">Ad</div>
                      <span className="text-zinc-500 font-bold">Display Ad Space</span>
                      <p className="text-zinc-600 text-xs mt-2 px-4 text-center">Managed by TubeX Self-Sustained Platform</p>
                 </div>
                 
                 {/* Up Next List (Mock) */}
                 {backend.getVideos().filter(v => v.id !== video.id).map(v => (
                     <div key={v.id} className="flex gap-2 cursor-pointer group" onClick={() => {
                         setView(ViewState.WATCH);
                         window.location.hash = ''; // reset helper
                         // In a real router, this would push. Here we rely on parent state update which needs key change or effect.
                         // For this single page simple implementation, we'll just trigger a re-render by calling passed setter.
                     }}>
                          <div className="w-40 aspect-video bg-zinc-800 rounded-lg overflow-hidden relative flex-shrink-0">
                              <img src={v.thumbnail} className="w-full h-full object-cover" />
                              <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">{v.duration}</span>
                          </div>
                          <div>
                              <h4 className="text-sm font-bold text-white line-clamp-2 group-hover:text-blue-400">{v.title}</h4>
                              <p className="text-xs text-zinc-400 mt-1">{backend.getUserById(v.userId)?.name}</p>
                              <p className="text-xs text-zinc-500">{v.views} views</p>
                          </div>
                     </div>
                 ))}
            </div>
        </div>
    );
};

const UploadPage = ({ currentUser, setView }: any) => {
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);

    const handleGenerateAI = async () => {
        if (!title && !desc) return alert("Enter at least a rough title or description for AI to work with.");
        setAiLoading(true);
        const result = await generateVideoMetadata(`${title} ${desc}`);
        setTitle(result.title);
        setDesc(result.description);
        setAiLoading(false);
    };

    const handleUpload = async () => {
        if (!file || !title) return;
        setUploading(true);
        const fakeUrl = URL.createObjectURL(file);
        
        await backend.uploadVideo({
            userId: currentUser.id,
            title,
            description: desc,
            url: fakeUrl,
            thumbnail: `https://picsum.photos/seed/${Date.now()}/640/360`, // Random thumb
            tags: ['new', 'upload'],
            duration: '10:00', // Mock duration
            category: 'General'
        });
        
        setUploading(false);
        alert('Video uploaded successfully!');
        setView(ViewState.PROFILE);
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Upload /> Upload Video
            </h1>
            
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                 {/* File Drop Area */}
                 <div className="border-2 border-dashed border-zinc-700 rounded-xl p-8 flex flex-col items-center justify-center mb-6 hover:border-blue-500 hover:bg-zinc-800/50 transition-all cursor-pointer relative">
                    <input 
                        type="file" 
                        accept="video/*" 
                        onChange={(e) => e.target.files && setFile(e.target.files[0])}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload size={48} className="text-zinc-500 mb-4" />
                    {file ? (
                        <p className="text-green-400 font-medium">{file.name}</p>
                    ) : (
                        <div className="text-center">
                            <p className="text-white font-medium">Drag and drop video files to upload</p>
                            <p className="text-zinc-500 text-sm mt-1">Your videos will be private until you publish them.</p>
                        </div>
                    )}
                 </div>

                 <div className="space-y-4">
                     <div>
                         <label className="block text-sm font-medium text-zinc-400 mb-1">Title</label>
                         <div className="flex gap-2">
                             <input 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none"
                                placeholder="Video title"
                             />
                             <button 
                                onClick={handleGenerateAI}
                                disabled={aiLoading}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 whitespace-nowrap"
                             >
                                 {aiLoading ? "Generating..." : "✨ AI Enhance"}
                             </button>
                         </div>
                     </div>
                     
                     <div>
                         <label className="block text-sm font-medium text-zinc-400 mb-1">Description</label>
                         <textarea 
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            className="w-full h-32 bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none resize-none"
                            placeholder="Tell viewers about your video"
                         />
                     </div>

                     <div className="pt-4 flex justify-end">
                         <button 
                            onClick={handleUpload}
                            disabled={uploading || !file}
                            className={`px-6 py-2 rounded-lg font-bold text-white ${uploading || !file ? 'bg-zinc-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                         >
                             {uploading ? 'Uploading...' : 'Publish'}
                         </button>
                     </div>
                 </div>
            </div>
        </div>
    );
};

const MonetizationPage = ({ currentUser, refreshUser }: any) => {
    const [applying, setApplying] = useState(false);
    
    if (!currentUser) return <div className="p-6 text-white">Please login first.</div>;

    const followerProgress = Math.min((currentUser.followers / 10000) * 100, 100);
    const viewProgress = Math.min((currentUser.viewsCount / 30000) * 100, 100);
    const eligible = currentUser.followers >= 10000 && currentUser.viewsCount >= 30000;

    const handleApply = async () => {
        setApplying(true);
        const success = await backend.applyForMonetization(currentUser.id);
        if (success) {
            refreshUser();
            alert("Congratulations! You are now a TubeX Partner.");
        } else {
            alert("Something went wrong or criteria not met.");
        }
        setApplying(false);
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-white mb-2">Channel Monetization</h1>
                <p className="text-zinc-400">Earn money from ads and YouTube Premium.</p>
            </div>

            {currentUser.isMonetized ? (
                <div className="bg-green-500/10 border border-green-500/50 rounded-xl p-8 text-center">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <DollarSign size={32} className="text-black" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">You are a TubeX Partner!</h2>
                    <p className="text-zinc-300">Monetization is active on your videos. Check your Analytics for revenue details.</p>
                    <div className="mt-6 flex justify-center gap-4">
                         <div className="bg-zinc-900 p-4 rounded-lg w-40">
                             <p className="text-zinc-400 text-xs uppercase mb-1">Est. Revenue</p>
                             <p className="text-2xl font-bold text-white">$1,240.50</p>
                         </div>
                    </div>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                        <h3 className="font-bold text-white mb-6">Eligibility Requirements</h3>
                        
                        {/* Requirement 1 */}
                        <div className="mb-8">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-zinc-300">Followers</span>
                                <span className="text-white font-medium">{currentUser.followers.toLocaleString()} / 10,000</span>
                            </div>
                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${followerProgress}%` }}></div>
                            </div>
                        </div>

                        {/* Requirement 2 */}
                        <div className="mb-8">
                             <div className="flex justify-between text-sm mb-2">
                                <span className="text-zinc-300">Video Views</span>
                                <span className="text-white font-medium">{currentUser.viewsCount.toLocaleString()} / 30,000</span>
                            </div>
                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${viewProgress}%` }}></div>
                            </div>
                        </div>

                        <button 
                            onClick={handleApply}
                            disabled={!eligible || applying}
                            className={`w-full py-3 rounded-lg font-bold transition-colors ${eligible ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
                        >
                            {applying ? 'Processing...' : 'Apply Now'}
                        </button>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex flex-col justify-center items-center text-center">
                         <ShieldCheck size={48} className="text-blue-500 mb-4" />
                         <h3 className="text-xl font-bold text-white mb-2">Why Monetize?</h3>
                         <p className="text-zinc-400 text-sm leading-relaxed">
                             Unlock revenue streams from ads displayed on your videos. 
                             Get access to Creator Support and our Copyright Match Tool.
                         </p>
                    </div>
                </div>
            )}
        </div>
    );
};

const ProfilePage = ({ currentUser, setView, refreshUser }: any) => {
    const [botLink, setBotLink] = useState(currentUser?.telegramBotLink || '');
    const [savingBot, setSavingBot] = useState(false);

    if (!currentUser) return <div className="p-6 text-white">Please login.</div>;

    const myVideos = backend.getVideos().filter(v => v.userId === currentUser.id);

    const handleSaveBot = async () => {
        setSavingBot(true);
        await backend.updateBotLink(currentUser.id, botLink);
        await refreshUser();
        setSavingBot(false);
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center gap-6 mb-8 border-b border-zinc-800 pb-8">
                <div className="w-32 h-32 rounded-full bg-zinc-700 overflow-hidden">
                    <img src={currentUser.avatar} alt="avatar" className="w-full h-full object-cover"/>
                </div>
                <div className="text-center md:text-left">
                    <h1 className="text-3xl font-bold text-white">{currentUser.name}</h1>
                    <div className="flex items-center justify-center md:justify-start gap-4 text-zinc-400 mt-2 text-sm">
                        <span>@{currentUser.name.replace(/\s+/g, '').toLowerCase()}</span>
                        <span>•</span>
                        <span>{currentUser.followers.toLocaleString()} subscribers</span>
                        <span>•</span>
                        <span>{myVideos.length} videos</span>
                    </div>
                    {currentUser.isMonetized && (
                         <span className="inline-block mt-3 bg-zinc-800 text-green-400 px-3 py-1 rounded text-xs font-bold border border-green-900">
                             ✓ Partner Verified
                         </span>
                    )}
                </div>
                <div className="flex-1"></div>
                <div className="flex gap-3">
                    <button className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-full font-medium">Customize Channel</button>
                    <button className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-full font-medium">Manage Videos</button>
                </div>
            </div>

            {/* Telegram Integration */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-6 mb-8">
                 <div className="flex items-start gap-4">
                     <div className="bg-blue-500 p-2 rounded-lg">
                         <Bot className="text-white" size={24} />
                     </div>
                     <div className="flex-1">
                         <h3 className="text-lg font-bold text-white mb-1">Telegram Bot Integration</h3>
                         <p className="text-zinc-400 text-sm mb-4">
                             Connect your Telegram bot to manage your channel, receive notifications, and interact with subscribers directly from Telegram.
                         </p>
                         
                         <div className="flex gap-2 max-w-md">
                             <input 
                                value={botLink}
                                onChange={(e) => setBotLink(e.target.value)}
                                placeholder="https://t.me/yourbot"
                                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-white text-sm"
                             />
                             <button 
                                onClick={handleSaveBot}
                                disabled={savingBot}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                             >
                                 {savingBot ? 'Connecting...' : 'Connect'}
                             </button>
                         </div>
                         {currentUser.telegramBotLink && (
                             <div className="mt-2 text-green-400 text-xs flex items-center gap-1">
                                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                 Bot Active & Listening
                             </div>
                         )}
                     </div>
                 </div>
            </div>

            <h2 className="text-xl font-bold text-white mb-4">Your Videos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                 {myVideos.map(v => (
                     <div key={v.id} className="cursor-pointer group">
                        <div className="aspect-video bg-zinc-800 rounded-lg overflow-hidden relative">
                             <img src={v.thumbnail} className="w-full h-full object-cover" />
                        </div>
                        <h3 className="text-white font-medium mt-2 line-clamp-1">{v.title}</h3>
                        <p className="text-zinc-500 text-xs">{v.views} views • {v.uploadDate}</p>
                     </div>
                 ))}
                 {myVideos.length === 0 && <p className="text-zinc-500">No videos uploaded yet.</p>}
            </div>
        </div>
    );
};

const AuthPage = ({ type, setView, onAuth }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (type === 'login') {
                await onAuth('login', { email, password });
            } else {
                await onAuth('signup', { name, email, password });
            }
            setView(ViewState.HOME);
        } catch (err) {
            alert('Authentication failed');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl w-full max-w-md shadow-2xl">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                         <Play fill="white" className="text-white ml-1" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">{type === 'login' ? 'Welcome Back' : 'Create Channel'}</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {type === 'signup' && (
                        <div>
                            <label className="text-sm font-medium text-zinc-400 block mb-1">Channel Name</label>
                            <input 
                                type="text" 
                                required 
                                value={name} 
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-red-600 outline-none transition-colors"
                            />
                        </div>
                    )}
                    <div>
                        <label className="text-sm font-medium text-zinc-400 block mb-1">Email Address</label>
                        <input 
                            type="email" 
                            required 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-red-600 outline-none transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-zinc-400 block mb-1">Password</label>
                        <input 
                            type="password" 
                            required 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-red-600 outline-none transition-colors"
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors mt-6 disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : (type === 'login' ? 'Sign In' : 'Create Channel')}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button 
                        onClick={() => setView(type === 'login' ? ViewState.SIGNUP : ViewState.LOGIN)}
                        className="text-zinc-400 hover:text-white text-sm"
                    >
                        {type === 'login' ? "Don't have a channel? Create one" : "Already have a channel? Sign in"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [videoList, setVideoList] = useState<Video[]>([]);
  
  // Load initial data
  useEffect(() => {
    setVideoList(backend.getVideos());
    setCurrentUser(backend.getCurrentUser());
  }, [view]); // Refresh when view changes (simple way to sync mocked state)

  const handleAuth = async (type: 'login' | 'signup', data: any) => {
      if (type === 'login') {
          const user = await backend.login(data.email, data.password);
          setCurrentUser(user);
      } else {
          const user = await backend.signup(data.name, data.email, data.password);
          setCurrentUser(user);
      }
  };

  const handleFollow = async (userId: string) => {
      if (!currentUser) return setView(ViewState.LOGIN);
      await backend.toggleFollow(userId);
      // Force refresh videos to update follower counts in UI if displayed
      setVideoList(backend.getVideos());
      alert("Subscribed!");
  };

  const handleSearch = (query: string) => {
      if (!query.trim()) {
          setVideoList(backend.getVideos());
          return;
      }
      const filtered = backend.getVideos().filter(v => v.title.toLowerCase().includes(query.toLowerCase()) || v.tags.includes(query.toLowerCase()));
      setVideoList(filtered);
      setView(ViewState.HOME);
  };

  const renderContent = () => {
      switch(view) {
          case ViewState.HOME:
              return <HomePage videos={videoList} setView={setView} setSelectedVideoId={setSelectedVideoId} />;
          case ViewState.WATCH:
              return selectedVideoId ? <WatchPage videoId={selectedVideoId} setView={setView} currentUser={currentUser} onFollow={handleFollow} /> : <HomePage videos={videoList} setView={setView} setSelectedVideoId={setSelectedVideoId} />;
          case ViewState.UPLOAD:
              return currentUser ? <UploadPage currentUser={currentUser} setView={setView} /> : <AuthPage type="login" setView={setView} onAuth={handleAuth} />;
          case ViewState.MONETIZATION:
              return currentUser ? <MonetizationPage currentUser={currentUser} refreshUser={() => setCurrentUser(backend.getCurrentUser())} /> : <AuthPage type="login" setView={setView} onAuth={handleAuth} />;
          case ViewState.PROFILE:
              return currentUser ? <ProfilePage currentUser={currentUser} setView={setView} refreshUser={() => setCurrentUser(backend.getCurrentUser())} /> : <AuthPage type="login" setView={setView} onAuth={handleAuth} />;
          case ViewState.LOGIN:
              return <AuthPage type="login" setView={setView} onAuth={handleAuth} />;
          case ViewState.SIGNUP:
              return <AuthPage type="signup" setView={setView} onAuth={handleAuth} />;
          default:
              return <HomePage videos={videoList} setView={setView} setSelectedVideoId={setSelectedVideoId} />;
      }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      <Header 
        user={currentUser} 
        setView={setView} 
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        onSearch={handleSearch}
      />
      
      <div className="flex pt-16 h-[calc(100vh-64px)]">
        <Sidebar 
            isOpen={sidebarOpen} 
            setView={setView} 
            activeView={view} 
            user={currentUser}
        />
        
        <main className={`flex-1 overflow-y-auto ${sidebarOpen ? 'md:ml-64' : ''} transition-all duration-300`}>
             {renderContent()}
        </main>
      </div>
    </div>
  );
}
