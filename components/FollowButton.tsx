

const FollowButton = ({userId, isFollowed}: {userId: string, isFollowed: boolean}) => {
  return (
    <button className="px-4 py-2 rounded-lg bg-foreground text-background hover:bg-red-600 transition">{isFollowed ? "Unfollow" : "Follow"}</button>
  )
}

export default FollowButton