<template>
	<view class="container">
		<view class="page-header">
			<text class="page-title">闹钟与提醒</text>
			<text class="page-subtitle">不错过每一个关爱时刻</text>
		</view>

		<view class="reminder-list" v-if="reminders.length > 0">
			<view class="reminder-card-modern" v-for="reminder in reminders" :key="reminder.id">
				<view class="card-left-icon">
					<view class="icon-circle" :class="reminder.status">{{getReminderIcon(reminder.type)}}</view>
				</view>
				
				<view class="card-center-info">
					<text class="remind-title">{{reminder.title}}</text>
					<view class="remind-meta">
						<text class="pet-name">{{getPetName(reminder.petId)}}</text>
						<text class="dot">·</text>
						<text class="date-text">{{formatDate(reminder.targetDate)}}</text>
					</view>
				</view>

				<view class="card-right-status">
					<view class="status-pill" :class="reminder.status">
						{{getReminderStatusText(reminder.status)}}
					</view>
					<view class="action-row">
						<view class="btn-round check" v-if="reminder.status === 'pending'" @tap="completeReminder(reminder)">✓</view>
						<view class="btn-round trash" @tap="deleteReminder(reminder)">×</view>
					</view>
				</view>
			</view>
		</view>

		<view class="empty-state-illust" v-else>
			<text class="illust-icon">🔔</text>
			<text class="illust-text">保持专注，暂时没有提醒</text>
			<text class="illust-tip">去记录里设置下次提醒吧</text>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return { reminders: [], pets: [] }
		},
		onLoad() { this.loadData(); },
		onShow() { this.loadData(); },
		methods: {
			loadData() {
				this.pets = uni.getStorageSync('pets') || [];
				const all = uni.getStorageSync('reminders') || [];
				this.reminders = all.sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate));
			},
			completeReminder(reminder) {
				uni.showModal({
					title: '完成确认',
					content: '已经完成这项任务了吗？',
					success: (res) => {
						if (res.confirm) {
							let all = uni.getStorageSync('reminders') || [];
							const idx = all.findIndex(r => r.id === reminder.id);
							if (idx > -1) {
								all[idx].status = 'completed';
								uni.setStorageSync('reminders', all);
								this.loadData();
							}
						}
					}
				});
			},
			deleteReminder(reminder) {
				uni.showModal({
					title: '删除提醒',
					content: '不再需要这个提醒了吗？',
					success: (res) => {
						if (res.confirm) {
							let all = uni.getStorageSync('reminders') || [];
							all = all.filter(r => r.id !== reminder.id);
							uni.setStorageSync('reminders', all);
							this.loadData();
						}
					}
				});
			},
			getPetName(id) { return this.pets.find(p => p.id === id)?.name || '小可爱'; },
			getReminderIcon(type) {
				const icons = { 'vaccine': '💉', 'deworm': '💊', 'bath': '🛁', 'medical': '🏥' };
				return icons[type] || '🔔';
			},
			getReminderStatusText(status) {
				const tx = { 'pending': '待出发', 'reminded': '已提醒', 'completed': '已完成' };
				return tx[status] || status;
			},
			formatDate(str) {
				const d = new Date(str); const now = new Date();
				const diff = Math.ceil((d - now) / 86400000);
				if (diff < 0) return '已过期';
				if (diff === 0) return '今天';
				if (diff === 1) return '明天';
				return `${d.getMonth() + 1}月${d.getDate()}日`;
			}
		}
	}
</script>

<style>
	.container {
		min-height: 100vh;
		background-color: var(--bg-main);
		padding: 40rpx;
	}

	.page-header { margin-bottom: 60rpx; }
	.page-title { font-size: 52rpx; font-weight: 800; color: var(--text-main); display: block; margin-bottom: 12rpx; }
	.page-subtitle { font-size: 26rpx; color: var(--text-muted); }

	.reminder-list { display: flex; flex-direction: column; gap: 32rpx; }

	.reminder-card-modern {
		background-color: #FFF;
		border-radius: var(--radius-lg);
		padding: 32rpx;
		display: flex;
		align-items: center;
		box-shadow: var(--shadow-soft);
	}

	.card-left-icon { margin-right: 32rpx; }
	.icon-circle {
		width: 100rpx;
		height: 100rpx;
		border-radius: var(--radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 48rpx;
		background-color: var(--bg-main);
	}
	.icon-circle.pending { background-color: var(--primary-light); color: var(--primary); }
	.icon-circle.completed { background-color: var(--secondary-light); color: var(--secondary); opacity: 0.6; }

	.card-center-info { flex: 1; }
	.remind-title { font-size: 32rpx; font-weight: 800; color: var(--text-main); margin-bottom: 12rpx; display: block; }
	.remind-meta { display: flex; align-items: center; font-size: 22rpx; color: var(--text-muted); }
	.pet-name { color: var(--secondary); font-weight: 600; }
	.dot { margin: 0 10rpx; }

	.card-right-status { display: flex; flex-direction: column; align-items: flex-end; gap: 20rpx; }
	.status-pill {
		padding: 6rpx 20rpx;
		border-radius: var(--radius-full);
		font-size: 20rpx;
		font-weight: 700;
	}
	.status-pill.pending { background-color: var(--primary); color: #FFF; }
	.status-pill.completed { background-color: var(--border-light); color: var(--text-muted); }

	.action-row { display: flex; gap: 16rpx; }
	.btn-round {
		width: 56rpx;
		height: 56rpx;
		border-radius: var(--radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 28rpx;
		font-weight: 800;
	}
	.btn-round.check { background-color: var(--secondary); color: #FFF; }
	.btn-round.trash { background-color: var(--bg-main); color: var(--text-muted); }

	.empty-state-illust {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding-top: 160rpx;
	}
	.illust-icon { font-size: 160rpx; margin-bottom: 40rpx; opacity: 0.5; }
	.illust-text { font-size: 32rpx; font-weight: 800; color: var(--text-main); margin-bottom: 16rpx; }
	.illust-tip { font-size: 24rpx; color: var(--text-muted); }
</style>
