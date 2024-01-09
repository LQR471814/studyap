import Navbar from '@/components/Navbar'
import { UserProfile } from '@clerk/nextjs'

const ProfilePage = () => {
    return(
        <>
        <Navbar />
        <div className='flex mx-auto mt-20'>
            <UserProfile />
        </div>
        </>
    )
}

export default ProfilePage