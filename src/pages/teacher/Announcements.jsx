import AnnouncementsBoard from '../../components/AnnouncementsBoard.jsx'

export default function TeacherAnnouncements() {
  return (
    <AnnouncementsBoard
      canCompose
      audienceFilter="Teachers"
      title="Announcements"
      subtitle="Staff notices and messages you can post to your classes"
    />
  )
}
