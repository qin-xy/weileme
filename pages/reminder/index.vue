<template>
	<view class="container">
		<view class="reminder-list" v-if="reminders.length > 0">
			<view class="reminder-card" v-for="reminder in reminders" :key="reminder.id">
				<view class="reminder-left">
					<text class="reminder-icon">{{getReminderIcon(reminder.type)}}</text>
					<view class="reminder-info">
						<view class="reminder-title">{{reminder.title}}</view>
						<view class="reminder-pet">{{getPetName(reminder.petId)}}</view>
						<view class="reminder-date">📅 {{formatDate(reminder.targetDate)}}</view>
					</view>
				</view>
				<view class="reminder-right">
					<view class="reminder-status" :class="reminder.status">
						{{getReminderStatusText(reminder.status)}}
					</view>
					<view class="reminder-actions">
						<button class="action-btn complete-btn" size="mini" v-if="reminder.status === 'pending'" @tap="completeReminder(reminder)">
							✓
						</button>
						<button class="action-btn delete-btn" size="mini" @tap="deleteReminder(reminder)">
							×
						</button>
					</view>
				</view>
			</view>
		</view>

		<view class="empty-state" v-else>
			<text class="empty-icon">⏰</text>
			<text class="empty-text">还没有提醒</text>
			<text class="empty-tip">添加疫苗、驱虫等记录时可以设置提醒</text>
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
							// 更新提醒状态
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
		background-color: #f8f9fa;
		padding: 24rpx;
	}

	.reminder-list {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}

	.reminder-card {
		background-color: #fff;
		border-radius: 24rpx;
		padding: 32rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.05);
	}

	.reminder-left {
		display: flex;
		align-items: center;
		flex: 1;
	}

	.reminder-icon {
		font-size: 56rpx;
		margin-right: 24rpx;
	}

	.reminder-info {
		flex: 1;
	}

	.reminder-title {
		font-size: 30rpx;
		font-weight: 700;
		color: #333;
		margin-bottom: 8rpx;
	}

	.reminder-pet {
		font-size: 24rpx;
		color: #ff6b6b;
		margin-bottom: 6rpx;
	}

	.reminder-date {
		font-size: 24rpx;
		color: #999;
	}

	.reminder-right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 12rpx;
	}

	.reminder-status {
		padding: 8rpx 20rpx;
		border-radius: 16rpx;
		font-size: 22rpx;
		font-weight: 600;
	}

	.reminder-status.pending {
		background-color: #fff3e0;
		color: #e65100;
	}

	.reminder-status.reminded {
		background-color: #e3f2fd;
		color: #1565c0;
	}

	.reminder-status.completed {
		background-color: #e8f5e9;
		color: #2e7d32;
	}

	.reminder-actions {
		display: flex;
		gap: 12rpx;
	}

	.action-btn {
		width: 60rpx;
		height: 60rpx;
		border-radius: 50%;
		border: none;
		font-size: 28rpx;
		font-weight: bold;
	}

	.complete-btn {
		background-color: #4caf50;
		color: #fff;
	}

	.delete-btn {
		background-color: #f44336;
		color: #fff;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 120rpx 0;
	}

	.empty-icon {
		font-size: 120rpx;
		margin-bottom: 24rpx;
		opacity: 0.5;
	}

	.empty-text {
		font-size: 28rpx;
		color: #999;
		margin-bottom: 12rpx;
		font-weight: 600;
	}

	.empty-tip {
		font-size: 24rpx;
		color: #ccc;
	}
</style>
