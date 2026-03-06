<template>
	<view class="container">
		<!-- 顶部导航栏 -->
		<view class="nav-header">
			<view class="nav-back" @tap="goBack">
				<text class="back-icon">‹</text>
			</view>
			<text class="nav-title">提醒</text>
			<view class="nav-placeholder"></view>
		</view>

		<view class="content">
			<!-- 提醒列表 -->
			<view class="reminder-list" v-if="reminders.length > 0">
				<view class="reminder-card" v-for="reminder in reminders" :key="reminder.id">
					<view class="reminder-main">
						<view class="reminder-icon-wrap">
							<text class="reminder-icon">{{getReminderIcon(reminder.type)}}</text>
						</view>
						<view class="reminder-content">
							<text class="reminder-title">{{reminder.title}}</text>
							<text class="reminder-pet">{{getPetName(reminder.petId)}}</text>
							<view class="reminder-date">
								<text class="date-icon">📅</text>
								<text class="date-text">{{formatDate(reminder.targetDate)}}</text>
							</view>
						</view>
					</view>
					<view class="reminder-right">
						<view class="reminder-status" :class="reminder.status">
							{{getReminderStatusText(reminder.status)}}
						</view>
						<view class="reminder-actions">
							<view class="action-btn complete-btn" v-if="reminder.status === 'pending'" @tap="completeReminder(reminder)">
								<text class="action-icon">✓</text>
							</view>
							<view class="action-btn delete-btn" @tap="deleteReminder(reminder)">
								<text class="action-icon">×</text>
							</view>
						</view>
					</view>
				</view>
			</view>

			<view class="empty-state-custom" v-else>
				<view class="empty-icon-wrap">
					<text class="empty-icon">⏰</text>
				</view>
				<text class="empty-text">还没有提醒</text>
				<text class="empty-tip">添加疫苗、驱虫等记录时可以设置提醒</text>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				reminders: [],
				pets: []
			}
		},
		onLoad() {
			this.loadData();
		},
		onShow() {
			this.loadData();
		},
		methods: {
			goBack() {
				uni.navigateBack();
			},

			loadData() {
				this.pets = uni.getStorageSync('pets') || [];
				const allReminders = uni.getStorageSync('reminders') || [];
				this.reminders = allReminders.sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate));
			},

			completeReminder(reminder) {
				uni.showModal({
					title: '确认',
					content: '确定完成这个提醒吗？',
					success: (res) => {
						if (res.confirm) {
							let reminders = uni.getStorageSync('reminders') || [];
							const index = reminders.findIndex(r => r.id === reminder.id);
							if (index > -1) {
								reminders[index].status = 'completed';
								uni.setStorageSync('reminders', reminders);
								this.loadData();
							}
						}
					}
				});
			},

			deleteReminder(reminder) {
				uni.showModal({
					title: '确认',
					content: '确定删除这个提醒吗？',
					success: (res) => {
						if (res.confirm) {
							let reminders = uni.getStorageSync('reminders') || [];
							reminders = reminders.filter(r => r.id !== reminder.id);
							uni.setStorageSync('reminders', reminders);
							this.loadData();
						}
					}
				});
			},

			getPetName(petId) {
				const pet = this.pets.find(p => p.id === petId);
				return pet ? pet.name : '未知';
			},

			getReminderIcon(type) {
				const icons = {
					'vaccine': '💉',
					'deworm': '💊',
					'bath': '🛁',
					'medical': '🏥',
					'other': '⏰'
				};
				return icons[type] || '⏰';
			},

			getReminderStatusText(status) {
				const texts = {
					'pending': '待提醒',
					'reminded': '已提醒',
					'completed': '已完成'
				};
				return texts[status] || status;
			},

			formatDate(dateStr) {
				const date = new Date(dateStr);
				const now = new Date();
				const diffTime = date - now;
				const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

				if (diffDays < 0) {
					return '已过期';
				} else if (diffDays === 0) {
					return '今天';
				} else if (diffDays === 1) {
					return '明天';
				} else if (diffDays < 7) {
					return `${diffDays}天后`;
				} else {
					return `${date.getMonth() + 1}月${date.getDate()}日`;
				}
			}
		}
	}
</script>

<style>
	.container {
		min-height: 100vh;
		background: linear-gradient(180deg, #FAF7F2 0%, #F5F0E8 100%);
	}

	/* 导航栏 */
	.nav-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 100rpx 32rpx 24rpx;
		background: linear-gradient(135deg, #C4A77D 0%, #A68B5B 100%);
	}

	.nav-back {
		width: 64rpx;
		height: 64rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.back-icon {
		font-size: 48rpx;
		color: #FFFFFF;
		font-weight: 300;
	}

	.nav-title {
		font-size: 34rpx;
		font-weight: 600;
		color: #FFFFFF;
	}

	.nav-placeholder {
		width: 64rpx;
	}

	/* 内容区域 */
	.content {
		padding: 24rpx 32rpx;
	}

	/* 提醒列表 */
	.reminder-list {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}

	.reminder-card {
		background: #FFFFFF;
		border-radius: 24rpx;
		padding: 28rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		box-shadow: 0 4rpx 16rpx rgba(61, 50, 41, 0.06);
	}

	.reminder-main {
		display: flex;
		align-items: center;
		flex: 1;
	}

	.reminder-icon-wrap {
		width: 72rpx;
		height: 72rpx;
		background: linear-gradient(135deg, #C4A77D 0%, #A68B5B 100%);
		border-radius: 18rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 20rpx;
		flex-shrink: 0;
	}

	.reminder-icon {
		font-size: 36rpx;
	}

	.reminder-content {
		flex: 1;
	}

	.reminder-title {
		font-size: 30rpx;
		font-weight: 700;
		color: #3D3229;
		margin-bottom: 6rpx;
	}

	.reminder-pet {
		font-size: 24rpx;
		color: #C4A77D;
		margin-bottom: 6rpx;
	}

	.reminder-date {
		display: flex;
		align-items: center;
		gap: 8rpx;
	}

	.date-icon {
		font-size: 22rpx;
	}

	.date-text {
		font-size: 22rpx;
		color: #9B8B7A;
	}

	.reminder-right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 16rpx;
	}

	.reminder-status {
		padding: 8rpx 20rpx;
		border-radius: 20rpx;
		font-size: 22rpx;
		font-weight: 600;
	}

	.reminder-status.pending {
		background: #F4E4D6;
		color: #C4A77D;
	}

	.reminder-status.reminded {
		background: #E8F4FD;
		color: #7D9BC4;
	}

	.reminder-status.completed {
		background: #E8F5E9;
		color: #7D9B76;
	}

	.reminder-actions {
		display: flex;
		gap: 12rpx;
	}

	.action-btn {
		width: 56rpx;
		height: 56rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.complete-btn {
		background: linear-gradient(135deg, #7D9B76 0%, #6B8A65 100%);
	}

	.delete-btn {
		background: linear-gradient(135deg, #C4786E 0%, #B3685F 100%);
	}

	.action-icon {
		color: #FFFFFF;
		font-size: 28rpx;
		font-weight: 600;
	}

	/* 空状态 */
	.empty-state-custom {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 120rpx 0;
	}

	.empty-icon-wrap {
		width: 140rpx;
		height: 140rpx;
		background: linear-gradient(135deg, #F4E4D6 0%, #E8D5C4 100%);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 24rpx;
	}

	.empty-icon {
		font-size: 72rpx;
	}

	.empty-text {
		font-size: 30rpx;
		color: #3D3229;
		margin-bottom: 12rpx;
		font-weight: 600;
	}

	.empty-tip {
		font-size: 24rpx;
		color: #9B8B7A;
	}
</style>
