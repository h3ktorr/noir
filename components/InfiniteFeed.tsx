"use client"

import { useInfiniteQuery } from "@tanstack/react-query"

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

  console.log(data);
  

  return (
    <div>InfiniteFeed</div>
  )
}

export default InfiniteFeed