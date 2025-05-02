import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

const mockPosts = [
  // Housemate Finder Posts
  {
    title: "Looking for 2 housemates - Ashby Road",
    content: "We're two second-year engineering students looking for 2 more housemates to join our house on Ashby Road. £95/week including bills. Available from July 2024. Must be clean and sociable!",
    category: "housemate-finder",
  },
  {
    title: "Female housemate wanted - Forest Road",
    content: "Looking for one female housemate to join our friendly house of 3 on Forest Road. £90/week, great location near uni and town. We're all third years studying different courses and love a good movie night!",
    category: "housemate-finder",
  },

  // For Sale Posts
  {
    title: "Selling desk and chair - Perfect for students",
    content: "Moving out and selling my IKEA desk (120x60cm) and ergonomic chair. Both in great condition, used for 1 year. Desk £30, chair £40, or £60 for both. Collection from Leopold Street.",
    category: "for-sale",
  },
  {
    title: "Textbooks for sale - Engineering Year 1",
    content: "Selling first-year engineering textbooks. All in excellent condition with minimal highlighting. Have books for Mechanics, Mathematics, and Materials. £20 each or make an offer for the lot.",
    category: "for-sale",
  },

  // Events Posts
  {
    title: "End of Year BBQ - All Welcome!",
    content: "Hosting a big BBQ to celebrate the end of exams! Saturday 15th June, 2pm onwards in our garden on Forest Road. £5 entry includes food. Bring your own drinks! Message for address.",
    category: "events",
  },
  {
    title: "5-a-side Football Tournament",
    content: "Organizing a 5-a-side football tournament at Loughborough Leisure Centre. Sunday 20th May, 1pm-5pm. £25 per team entry, winning team gets £100! All skill levels welcome.",
    category: "events",
  },

  // Questions Posts
  {
    title: "Best letting agents in Lboro?",
    content: "First time renting next year - which letting agents would you recommend? Heard mixed things about Nicholas Humphreys. Looking for honest experiences and advice!",
    category: "questions",
  },
  {
    title: "How to get to East Midlands Airport?",
    content: "What's the cheapest/easiest way to get to East Midlands Airport from campus? Is there a direct bus or should I book a taxi? Flying home next week and need to plan transport.",
    category: "questions",
  },

  // House Hunting Posts
  {
    title: "Best streets for student houses?",
    content: "Starting to look for houses for next year. Which streets would you recommend? Heard Forest Road is good but expensive. Looking for somewhere with good bus links to campus.",
    category: "house-hunting",
  },
  {
    title: "6-bed house viewing tips needed",
    content: "Viewing a 6-bed house tomorrow on Leopold Street. What should I look out for? First time renting so any advice appreciated! Particularly concerned about damp and heating costs.",
    category: "house-hunting",
  },

  // Student Life Posts
  {
    title: "Best study spots on campus?",
    content: "Library is always packed during exam season. Where are your favorite alternative study spots on campus? Looking for somewhere quiet with good wifi and power outlets.",
    category: "student-life",
  },
  {
    title: "Cheapest supermarket in Lboro?",
    content: "Trying to save money on groceries. Which supermarket do you find cheapest? Currently going to Tesco but wondering if Aldi/Lidl would be better. Also, best times to get reduced items?",
    category: "student-life",
  },
];

async function generateMockPosts() {
  try {
    // Get all users to distribute votes
    const users = await prisma.user.findMany({
      take: 20, // Get up to 20 users for voting
    });

    if (users.length === 0) {
      console.error('No users found to create posts with');
      return;
    }

    console.log('Generating mock posts...');

    for (const post of mockPosts) {
      // Create post with a random author
      const author = users[Math.floor(Math.random() * users.length)];
      const createdPost = await prisma.discussionPost.create({
        data: {
          title: post.title,
          content: post.content,
          category: post.category,
          authorId: author.id,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
        },
      });

      // Add random number of upvotes (1-10) from different users
      const numVotes = Math.floor(Math.random() * 10) + 1;
      const votingUsers = users
        .filter(u => u.id !== author.id) // Don't let the author vote on their own post
        .sort(() => Math.random() - 0.5) // Shuffle users
        .slice(0, numVotes); // Take the first numVotes users

      for (const votingUser of votingUsers) {
        await prisma.postVote.create({
          data: {
            value: 1,
            postId: createdPost.id,
            userId: votingUser.id,
          },
        });
      }

      console.log(`Created post: ${post.title} (${post.category})`);
      console.log(`Added ${votingUsers.length} votes\n`);
    }

    console.log('Successfully generated all mock posts!');
  } catch (error) {
    console.error('Error generating mock posts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
generateMockPosts()
  .then(() => console.log('Done'))
  .catch(console.error); 