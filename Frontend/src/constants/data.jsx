import Bunny1 from "../photo&Video/Bunny1.jpg"
import Bunny2 from "../photo&Video/Bunny2.jpg"
import BunnyVideo from "../photo&Video/BunnyVideo.mp4"
import AnotherVideo from "../photo&Video/AnotherVideo.mp4"
import Another from "../photo&Video/Another.jpeg"
import { FiHome, FiPlus, FiTrendingUp, FiTwitter, FiUser } from "react-icons/fi"

const createMediaItems = (items, total) => Array.from({ length: total }, (_, index) => ({
  ...items[index % items.length],
  id: index + 1,
}));

const videoSources = [
  { id: 1, title: "Big Buck Bunny", views: "10.3k", time: "44 minutes ago", channel: "Bunny", duration: "0:38", thumb: Bunny1, avatar: Bunny2,Catagory:"Cartoon" },
  { id: 2, title: "Getting Started with Express.js", views: "11k", time: "5 hours ago", channel: "Express Learner", duration: "3:44", thumb: Another, avatar: "https://images.pexels.com/photos/2519812/pexels-photo-2519812.jpeg?auto=compress&cs=tinysrgb&w=100", Catagory:"Education" },
  { id: 3, title: "Building a RESTful API with Node.js and Express", views: "14.5k", time: "7 hours ago", channel: "API Builder", duration: "24:33", thumb: "https://images.pexels.com/photos/1739849/pexels-photo-1739849.jpeg?auto=compress&cs=tinysrgb&w=600", avatar: "https://images.pexels.com/photos/1739942/pexels-photo-1739942.jpeg?auto=compress&cs=tinysrgb&w=100", Catagory:"Technology" },
  { id: 4, title: "Introduction to React Native", views: "10.9k", time: "8 hours ago", channel: "React Native Dev", duration: "19:58", thumb: "https://images.pexels.com/photos/1739854/pexels-photo-1739854.jpeg?auto=compress&cs=tinysrgb&w=600", avatar: "https://images.pexels.com/photos/1739856/pexels-photo-1739856.jpeg?auto=compress&cs=tinysrgb&w=100", Catagory:"Technology" },
];

export const VIDEOS = createMediaItems(videoSources, 12);

const imageSources = [
  ["Beautiful Landscape", "5.2k", "Nature Lover", "210186"],
  ["City Skyline at Night", "8.7k", "Urban Explorer", "338515"],
  ["Delicious Food Platter", "12.1k", "Foodie", "70497"],
  ["Cute Puppy Playing", "9.4k", "Animal Lover", "4587990"],
].map(([title, views, channel, photo]) => ({
  title,
  views,
  time: "2 hours ago",
  channel,
  thumb: `https://images.pexels.com/photos/${photo}/pexels-photo-${photo}.jpeg?auto=compress&cs=tinysrgb&w=600`,
  avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100",
}));

export const IMAGES = createMediaItems(imageSources, 14);

export const initialTweets = [
  {
    id: 1,
    name: 'Jane Doe',
    handle: 'janedoe',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
    verified: true,
    time: '2h',
    content: 'Just explored the new deep dives in the #NeoPlus support center. The FAQ updates are super fast and the categories grid makes finding answers effortless! Highly recommend checking it out. 👏✨ @NeoPlusOfficial',
    likes: 124,
    retweets: 18,
    hasPreview: true,
    initialComments: [
      { id: 101, user: 'Mike T.', text: 'Totally agree, the new UI is amazing!', likes: 4, dislikes: 0, replies: [] }
    ]
  },
  {
    id: 2,
    name: 'Tech Insider',
    handle: 'techinsider',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&h=256&q=80',
    verified: true,
    time: '4h',
    content: 'The new Purple UI framework is taking the dev world by storm. Are you switching from Tailwind or sticking to the classics? Let us know below! 🚀💜',
    likes: 892,
    retweets: 104,
    hasPreview: false,
    initialComments: []
  },
  {
    id: 4,
    name: 'Alex Chen',
    handle: 'alexc_dev',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
    verified: false,
    time: '1m',
    content: 'Just deployed my first Next.js app using edge functions. The latency difference is insane! Highly recommend looking into it if you build global apps.',
    likes: 12,
    retweets: 2,
    hasPreview: false,
    initialComments: [
      { id: 102, user: 'Sarah W.', text: 'Edge functions are a game changer.', likes: 2, dislikes: 0, replies: [] }
    ]
  },  {
    id: 5,
    name: 'Tech Insider',
    handle: 'techinsider',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&h=256&q=80',
    verified: true,
    time: '4h',
    content: 'The new Purple UI framework is taking the dev world by storm. Are you switching from Tailwind or sticking to the classics? Let us know below! 🚀💜',
    likes: 892,
    retweets: 104,
    hasPreview: false,
    initialComments: []
  },
  {
    id: 6,
    name: 'Alex Chen',
    handle: 'alexc_dev',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
    verified: false,
    time: '1m',
    content: 'Just deployed my first Next.js app using edge functions. The latency difference is insane! Highly recommend looking into it if you build global apps.',
    likes: 12,
    retweets: 2,
    hasPreview: false,
    initialComments: [
      { id: 102, user: 'Sarah W.', text: 'Edge functions are a game changer.', likes: 2, dislikes: 0, replies: [] }
    ]
  },  {
    id: 7,
    name: 'Tech Insider',
    handle: 'techinsider',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&h=256&q=80',
    verified: true,
    time: '4h',
    content: 'The new Purple UI framework is taking the dev world by storm. Are you switching from Tailwind or sticking to the classics? Let us know below! 🚀💜',
    likes: 892,
    retweets: 104,
    hasPreview: false,
    initialComments: []
  },
  {
    id: 8,
    name: 'Alex Chen',
    handle: 'alexc_dev',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
    verified: false,
    time: '1m',
    content: 'Just deployed my first Next.js app using edge functions. The latency difference is insane! Highly recommend looking into it if you build global apps.',
    likes: 12,
    retweets: 2,
    hasPreview: false,
    initialComments: [
      { id: 102, user: 'Sarah W.', text: 'Edge functions are a game changer.', likes: 2, dislikes: 0, replies: [] }
    ]
  }
];
export const NAV_ITEMS = [
  {
    label: "Home",
    icon: <FiHome className="w-5 h-5 shrink-0" />,
    mobileOnly: false,
    Link: "/",

  },
  {
    label: "Tweets",
    icon: <FiTwitter className="w-5 h-5 shrink-0" />,
    desktopOnly: true,
    Link: "/tweets"
  },
  {
    label: "Creator",
    icon: <FiPlus className="w-5 h-5 shrink-0" />,
    Link: "/creator"
  },
  {
    label: "Trending",
    icon: <FiTrendingUp className="w-5 h-5 shrink-0" />,
    desktopOnly: true,
  },
  {
    label: "UserX",
    icon: 
      <FiUser className="w-5 h-5 shrink-0" />

  }
];

export const BOTTOM_NAV_ITEMS = [
  NAV_ITEMS[0], // Home
  NAV_ITEMS[1], //  Tweets
  NAV_ITEMS[2], // Creator
  NAV_ITEMS[3], // Trending
  NAV_ITEMS[4], // User
  
];

export const RawVideo = [
{id: 1, VideoSrc: BunnyVideo},
{id:2, VideoSrc: AnotherVideo}
]



export const creators = [
  { id: 1, name: "Alex Rivers", handle: "@arivers", color: "from-blue-500 to-cyan-400" },
  { id: 2, name: "Elena Rostova", handle: "@elena_r", color: "from-purple-600 to-pink-500" },
  { id: 3, name: "Marcus Vance", handle: "@mvance", color: "from-teal-400 to-emerald-500" },
  { id: 4, name: "Zara Chen", handle: "@zarac", color: "from-cyan-500 to-blue-600" },
  { id: 5, name: "Kai Sterling", handle: "@kasterling", color: "from-purple-500 to-indigo-500" },
  { id: 6, name: "Nova Blake", handle: "@novab", color: "from-teal-500 to-cyan-300" },
];

export const initialCommentsData = [
  {
    id: 1,
    user: 'Alex Rivera',
    handle: '@alex_dev',
    text: "Framer Motion simplifies layouts so much. Creating the swipe gestures on mobile with standard spring physics used to take hours of manual touch listener calculations!",
    time: Date.now() - 3600000 * 2, // 2h ago
    likes: 84,
    dislikes: 2,
    replies: [
      {
        id: 101,
        user: 'Sarah Jenkins',
        handle: '@sarah_codes',
        text: "Totally agree! Especially when combining layout animations with layoutId. It is incredibly fluid.",
        time: Date.now() - 3600000 * 1.5,
      }
    ]
  },
  {
    id: 2,
    user: 'Marcus Chen',
    handle: '@marcus_c',
    text: "Can you showcase how we would set up the touch targets to avoid accidentally triggering a parent scroll container inside horizontal carousels?",
    time: Date.now() - 3600000 * 4, // 4h ago
    likes: 31,
    dislikes: 0,
    replies: []
  },
  {
    id: 3,
    user: 'Sarah Jenkins',
    handle: '@sarah_codes',
    text: "The swipe gesture physics on mobile feels amazingly native. Thanks for using Framer Motion instead of heavy third-party carousel wrappers!",
    time: Date.now() - 3600000 * 6, // 6h ago
    likes: 56,
    dislikes: 1,
    replies: [
      {
        id: 301,
        user: 'Alex Rivera',
        handle: '@alex_dev',
        text: "Yes, standard CSS carousel grids combined with motion.div is always the way to go.",
        time: Date.now() - 3600000 * 5,
      }
    ]
  },
  {
    id: 4,
    user: 'Sophia Alistair',
    handle: '@sophia_design',
    text: "The transition between the vertical desktop card grid and the horizontal mobile swipe cards is flawless. Great responsive architectural planning!",
    time: Date.now() - 3600000 * 8, // 8h ago
    likes: 19,
    dislikes: 0,
    replies: []
  },
  {
    id: 5,
    user: 'Dr. Evelyn Foster',
    handle: '@evy_foster',
    text: "Structuring nested arrays directly inside local React state hooks makes debugging real-time mutations incredibly straightforward. Love this implementation.",
    time: Date.now() - 3600000 * 12, // 12h ago
    likes: 47,
    dislikes: 3,
    replies: []
  },
  {
    id: 6,
    user: 'Tariq Al-Jamil',
    handle: '@tariq_codes',
    text: "Do you have any recommendations for handling keyboard tab navigation inside these dynamic Framer Motion list elements?",
    time: Date.now() - 3600000 * 24, // 1d ago
    likes: 12,
    dislikes: 0,
    replies: []
  },
  {
    id: 7,
    user: 'Chloe Vance',
    handle: '@chloe_v',
    text: "This dark mode color scheme is perfectly balanced. Midnight-blue background combined with deep slate and vibrant purple highlights works beautifully.",
    time: Date.now() - 3600000 * 48, // 2d ago
    likes: 29,
    dislikes: 1,
    replies: []
  }
];

export const TRENDING_VIDEOS = [
  {
    id: 1,
    title: "React Tutorial",
    thumb: "/images/react.jpg",
    avatar: "/images/user1.jpg",
    channel: "Code Master",
    views: "120K",
    time: "2 days ago",
    duration: "15:30",
  },
  {
    id: 2,
    title: "Tailwind CSS Crash Course",
    thumb: "/images/tailwind.jpg",
    avatar: "/images/user2.jpg",
    channel: "Web Dev",
    views: "85K",
    time: "1 week ago",
    duration: "20:15",
  },
];

export const INITIAL_HISTORY = VIDEOS;




