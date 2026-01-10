import Story1 from "./story-1.jpg";
import Story2 from "./story-2.jpg";
import Story3 from "./story-3.jpg";
import Story4 from "./story-4.jpg";
import Story5 from "./story-5.jpg";
import Story6 from "./story-6.jpg";
import Profile1 from "./profile-1.jpg";
import Profile2 from "./profile-2.jpg";
import Profile3 from "./profile-3.jpg";
import Profile4 from "./profile-4.jpg";
import Profile5 from "./profile-5.jpg";
import Profile6 from "./profile-6.jpg";

export const stories = [
  {
    id: 1,
    name: "Julian Parker",
    image: Profile1,
    story: Story1,
  },
  {
    id: 2,
    name: "Ethan Cole",
    image: Profile2,
    story: Story2,
  },
  {
    id: 3,
    name: "Noah Alvarez",
    image: Profile3,
    story: Story3,
  },
  {
    id: 4,
    name: "Lina Moreau",
    image: Profile4,
    story: Story4,
  },
  {
    id: 5,
    name: "Zara Mitchell",
    image: Profile5,
    story: Story5,
  },
  {
    id: 6,
    name: "Amani Rivers",
    image: Profile6,
    story: Story6,
  },
];

export const feeds = [
  {
    id: 13,
    name: "Julian Parker",
    userImage: Profile1,
    feedImage: Story1,
    caption:
      "Lost in the beauty of nature 🏔️ The mountains are calling and I must go!",
    likes: 445,
    createdAt: "2 hrs ago",
  },
  {
    id: 22,
    name: "Zara Mitchell",
    userImage: Profile5,
    feedImage: Story4,
    caption: "Sunday brunch done right 🥞✨ Recipe coming soon!",
    likes: 505,
    createdAt: "3 hrs ago",
  },
  {
    id: 33,
    name: "Noah Alvarez",
    userImage: Profile3,
    feedImage: Story2,
    caption: "New season, new style 👗 Who else is excited for fall fashion?",
    likes: 675,
    createdAt: "4 days ago",
  },
  {
    id: 44,
    name: "Lina Moreau",
    userImage: Profile2,
    feedImage: Story6,
    caption: "City lights and architectural wonders 🌆 Never gets old!",
    likes: 958,
    createdAt: "1 week ago",
  },
];

export const allMessages = [
  {
    id: 11,
    name: "Julian Parker",
    image: Profile1,
    message: "Hey! Are we still on for tomorrow?",
    createdAt: "2:30 PM",
  },
  {
    id: 21,
    name: "Lina Moreau",
    image: Profile4,
    message: "Can you send me the files?",
    createdAt: "7:01 AM",
  },
  {
    id: 31,
    name: "Noah Alvarez",
    image: Profile3,
    message: "Hello! Just wanted to check in.",
    createdAt: "1:04 PM",
  },
  {
    id: 41,
    name: "Zara Mitchell",
    image: Profile5,
    message: "Hi, How are you?",
    createdAt: "3:55 AM",
  },
];

export const notifications = [
  {
    id: 17,
    username: "Amani_rivers",
    image: Profile1,
    text: "liked your photo.",
    createdAt: "2 hrs ago",
  },
  {
    id: 27,
    username: "Ethan_cole",
    image: Profile2,
    text: "commented: Awesome shot!",
    createdAt: "3 hrs ago",
  },
  {
    id: 37,
    username: "Noah_alvarez",
    image: Profile3,
    text: "started following you.",
    createdAt: "5 hrs ago",
  },
];

export const user = {
  id: 17,
  username: "Amani_rivers",
  displayName: "Amani Rivers",
  image: Profile6,
  coverImage: Story3,
  bio: "Photographer & Traveler",
  location: "New York, USA",
  createdAt: new Date("2021-05-15"),
  _count: {
    followers: 1200,
    following: 300,
  },
};
