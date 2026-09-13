import { Mail, Shield, UserCircle } from 'lucide-react'

import { PageIntro } from '@components/shared/PageIntro'
import { useAuth } from '@hooks/useAuth'

export function ProfilePage() {
	const { data: session, isPending } = useAuth()

	if (isPending) return <div className="empty-state">Loading profile…</div>

	const user = session?.user
	if (!user) {
		return (
			<section>
				<PageIntro eyebrow="Profile" title="Your profile" description="Sign in to view your learning profile." />
				<div className="panel empty-state">
					<p>You are currently browsing as a guest.</p>
					<a className="primary-button profile-sign-in" href="/auth">Sign in</a>
				</div>
			</section>
		)
	}

	const initials = user.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
	return (
		<section>
			<PageIntro eyebrow="Account" title="Your profile" description="A quick overview of your account and learning workspace." />
			<div className="profile-layout">
				<div className="panel profile-hero">
					<div className="profile-avatar-large">{initials || <UserCircle size={28} />}</div>
					<div>
						<span className="eyebrow">Learner profile</span>
						<h2>{user.name}</h2>
						<p>Keep building your mental model, one question at a time.</p>
					</div>
				</div>
				<div className="panel">
					<div className="panel-heading"><div><span className="eyebrow">Account details</span><h2>Personal information</h2></div></div>
					<div className="profile-detail"><UserCircle size={17} /><span><small>Name</small><strong>{user.name}</strong></span></div>
					<div className="profile-detail"><Mail size={17} /><span><small>Email</small><strong>{user.email}</strong></span></div>
					<div className="profile-detail"><Shield size={17} /><span><small>Account status</small><strong>Active</strong></span></div>
				</div>
			</div>
			<div className="panel profile-note">
				<span className="eyebrow">Privacy</span>
				<p>Your profile page uses your existing authenticated session only. No additional personal or behavioral data is collected here.</p>
			</div>
		</section>
	)
}
