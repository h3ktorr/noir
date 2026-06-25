"use client"

import { useInfiniteQuery } from "@tanstack/react-query";
import InfiniteScroll from "react-infinite-scroll-component";
import Post from "./Post";

const fetchPosts = async (pageParam: number, userProfileId?: string) => {
  const res = await fetch("/api/posts?cursor="+pageParam+"&user="+userProfileId)
  if(!res.ok) throw new Error('Network response was not ok')
  return res.json()
}

const InfiniteFeed = ({userProfileId}: {userProfileId?: string}) => {

  const {data, error, status, hasNextPage, fetchNextPage} = useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({pageParam = 2}) => fetchPosts(pageParam, userProfileId),
    initialPageParam: 2,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 2 : undefined;
    },
  })

  if(error) return <div>Error: {error.message}</div>
  if(status === 'pending') return <div>Loading...</div>

  
  console.log("Data:", data);
  console.log("First page:", data?.pages[0]);
  const allPosts = data?.pages.flatMap(page => page.post) || [];
  console.log("All Posts:", allPosts);

  
  return (
    <InfiniteScroll
      dataLength={allPosts.length}
      next={fetchNextPage} 
      hasMore={hasNextPage} 
      loader={<div>Loading...</div>}
      endMessage={<div>All posts loaded</div>}
    >
      {allPosts.map((post) => (
        <Post key={post.id} post={post} />
      ))}
    </InfiniteScroll>
  )
}

export default InfiniteFeed