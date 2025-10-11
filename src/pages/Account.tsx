import ProfileHeader from "@/components/profile-page/components/profile-header";
import ProfileContent from "@/components/profile-page/components/profile-content";

export default function Account() {

  return (
    <div className="container mx-auto space-y-6 px-4 py-10 ">
      <ProfileHeader/>
      <ProfileContent />
    </div>
  );
}
