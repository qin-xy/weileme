<template>
	<view class="container">
		<view v-if="pet" class="pet-header">
			<view class="avatar-section">
				<image :src="pet.avatar || '/static/default-pet.png'" mode="aspectFill" class="avatar"></image>
			</view>
 		<view class="pet-info">
 			<view class="pet-name-row">
 				<view class="pet-name">{{pet.name}}</view>
 				<button class="action-btn delete-btn header-delete" @tap="confirmDelete">删除</button>
 			</view>
				<view class="pet-meta">
					<text class="meta-tag">{{getPetTypeText(pet.type)}}</text>
					<text class="meta-tag" v-if="pet.breed">{{pet.breed}}</text>
					<text class="meta-tag" v-if="pet.gender">{{pet.gender === 'male' ? '♂ 公' : '♀ 母'}}</text>
				</view>
				<view class="pet-meta-detail">
					<text v-if="pet.birthday">🎂 {{calculateAge(pet.birthday)}}</text>
					<text v-if="pet.weight">⚖️ {{pet.weight}}kg</text>
				</view>
			</view>
		</view>

		<view class="tabs">
			<view class="tab" :class="{active: activeTab === 0}" @tap="activeTab = 0">记录</view>
			<view class="tab" :class="{active: activeTab === 1}" @tap="activeTab = 1">提醒</view>
		</view>

		<view v-if="activeTab === 0" class="records-section">
			<view class="record-list" v-if="records.length > 0">
				<view class="record-card" v-for="record in records" :key="record.id" @tap="viewRecordDetail(record)">
					<view class="record-header">
						<text class="record-icon">{{getRecordIcon(record.type)}}</text>
						<text class="record-type">{{getRecordTypeName(record.type)}}</text>
						<text class="record-time">{{formatDateTime(record.date)}}</text>
					</view>
					<view class="record-body">
						<text class="record-remark">{{record.remark}}</text>
					</view>
					<view class="record-images" v-if="record.images && record.images.length > 0">
						<image v-for="(img, idx) in record.images.slice(0, 3)" :key="idx" :src="img" mode="aspectFill" class="record-image"></image>
					</view>
				</view>
			</view>
			<view class="empty-state" v-else>
				<text class="empty-icon">📝</text>
				<text class="empty-text">还没有记录</text>
				<text class="empty-tip">点击下方按钮添加第一条记录</text>
			</view>
		</view>

		<view v-if="activeTab === 1" class="reminders-section">
			<view class="reminder-list" v-if="reminders.length > 0">
				<view class="reminder-card" v-for="reminder in reminders" :key="reminder.id">
					<text class="reminder-icon">{{getReminderIcon(reminder.type)}}</text>
					<view class="reminder-info">
						<view class="reminder-title">{{reminder.title}}</view>
						<view class="reminder-date">📅 {{formatDate(reminder.targetDate)}}</view>
					</view>
					<view class="reminder-status" :class="reminder.status">
						{{getReminderStatusText(reminder.status)}}
					</view>
				</view>
			</view>
			<view class="empty-state" v-else>
				<text class="empty-icon">⏰</text>
				<text class="empty-text">还没有提醒</text>
				<text class="empty-tip">添加记录时可以设置提醒</text>
			</view>
		</view>

		<view class="footer-actions">
			<button class="action-btn" @tap="addRecord">📝 添加记录</button>
		</view>
	</view>
</template>

<script>
	import { getPetById, getRecords, getReminders, deletePet } from '../../utils/api.js';
	import { getUserId } from '../../utils/user.js';

	export default {
		data() {
			return {
				petId: '',
				pet: null,
				activeTab: 0,
				records: [],
				reminders: []
			}
		},
		onLoad(options) {
			this.petId = options.id;
			this.loadData();
		},
		onShow() {
			this.loadData();
		},
		methods: {
			async loadData() {
				try {
					const userId = await getUserId();
					const [pet, records, reminders] = await Promise.all([
						getPetById(this.petId),
						getRecords({ petId: this.petId, userId }),
						getReminders({ petId: this.petId, userId })
					]);

					this.pet = pet || null;
					this.records = (records || []).sort((a, b) => this.parseRecordDate(b.date) - this.parseRecordDate(a.date));
					this.reminders = (reminders || []).sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate));
				} catch (error) {
					this.pet = null;
					this.records = [];
					this.reminders = [];
					uni.showToast({ title: error.message || '加载失败', icon: 'none' });
				}
			},

			addRecord() {
				uni.navigateTo({
					url: `/pages/record/add?petId=${this.petId}`
				});
			},

			confirmDelete() {
				if (!this.petId) return;
				uni.showModal({
					title: '删除宠物',
					content: '删除后将无法恢复，相关记录与提醒也会同时清除。确定删除吗？',
					confirmText: '删除',
					confirmColor: '#d9534f',
					success: async (res) => {
						if (!res.confirm) return;
						try {
							uni.showLoading({ title: '删除中...' });
							const result = await deletePet(this.petId);
							if (result && result.success === false) {
								throw new Error('删除失败');
							}
							this.pet = null;
							this.records = [];
							this.reminders = [];
							uni.showToast({
								title: '删除成功',
								icon: 'success',
								success: () => {
									setTimeout(() => {
										uni.navigateBack();
									}, 1200);
								}
							});
						} catch (error) {
							uni.showToast({ title: error.message || '删除失败', icon: 'none' });
						} finally {
							uni.hideLoading();
						}
					}
				});
			},

			viewRecordDetail(record) {
				uni.showModal({
					title: getRecordTypeName(record.type),
					content: record.remark,
					showCancel: false
				});
			},

			getPetTypeText(type) {
				const types = {
					'狗狗': '狗狗',
					'猫咪': '猫咪',
					'鸟类': '鸟类',
					'其他': '其他'
				};
				return types[type] || type;
			},

			calculateAge(birthday) {
				if (!birthday) return '未知';
				const birth = new Date(birthday);
				const now = new Date();
				const diffTime = Math.abs(now - birth);
				const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

				if (diffDays < 30) {
					return `${diffDays}天`;
				} else if (diffDays < 365) {
					return `${Math.floor(diffDays / 30)}个月`;
				} else {
					return `${Math.floor(diffDays / 365)}岁`;
				}
			},

			getRecordIcon(type) {
				const icons = {
					'feed': '🍖',
					'walk': '🚶',
					'bath': '🛁',
					'vaccine': '💉',
					'deworm': '💊',
					'medical': '🏥',
					'sleep': '😴',
					'weight': '⚖️',
					'other': '📦'
				};
				return icons[type] || '📦';
			},

			getRecordTypeName(type) {
				const names = {
					'feed': '喂食',
					'walk': '遛弯',
					'bath': '洗澡',
					'vaccine': '打疫苗',
					'deworm': '驱虫',
					'medical': '就医',
					'sleep': '睡觉',
					'weight': '体重记录',
					'other': '其他'
				};
				return names[type] || type;
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

			parseRecordDate(dateStr) {
				if (!dateStr) return new Date(0);
				const directDate = new Date(dateStr);
				if (!isNaN(directDate.getTime())) {
					return directDate;
				}

				const match = dateStr.match(/^(\d{1,2})月(\d{1,2})日\s*(\d{1,2})?:?(\d{2})?$/);
				if (!match) return new Date(0);

				const [, monthStr, dayStr, hourStr, minuteStr] = match;
				const year = new Date().getFullYear();
				const month = Number(monthStr) - 1;
				const day = Number(dayStr);
				const hour = hourStr ? Number(hourStr) : 0;
				const minute = minuteStr ? Number(minuteStr) : 0;
				return new Date(year, month, day, hour, minute);
			},

			formatDateTime(dateStr) {
				const date = this.parseRecordDate(dateStr);
				if (isNaN(date.getTime())) {
					return dateStr || '';
				}
				const now = new Date();
				const diffTime = Math.abs(now - date);
				const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

				if (diffDays === 0) {
					const hours = Math.floor(diffTime / (1000 * 60 * 60));
					const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
					if (hours === 0) {
						return `${minutes}分钟前`;
					}
					return `${hours}小时前`;
				} else if (diffDays === 1) {
					return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
				} else if (diffDays < 7) {
					return `${diffDays}天前`;
				} else {
					return `${date.getMonth() + 1}/${date.getDate()}`;
				}
			},

			formatDate(dateStr) {
				const date = new Date(dateStr);
				if (isNaN(date.getTime())) {
					return dateStr || '';
				}
				return `${date.getMonth() + 1}月${date.getDate()}日`;
			}
		}
	}
</script>

<style>
	.container {
		min-height: 100vh;
		background-color: #f8f9fa;
		padding-bottom: 120rpx;
	}

	.pet-header {
		background: linear-gradient(135deg, #ffb347, #ff6b6b);
		padding: 60rpx 40rpx 40rpx;
		display: flex;
		align-items: center;
		border-radius: 0 0 40rpx 40rpx;
	}

	.avatar-section {
		margin-right: 32rpx;
	}

	.avatar {
		width: 160rpx;
		height: 160rpx;
		border-radius: 50%;
		border: 6rpx solid rgba(255, 255, 255, 0.5);
	}

	.pet-info {
		flex: 1;
		color: #fff;
	}

	.pet-name-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16rpx;
	}

	.pet-name {
		font-size: 44rpx;
		font-weight: 800;
		margin-bottom: 16rpx;
	}

	.header-delete {
		font-size: 24rpx;
		padding: 0 24rpx;
		height: 56rpx;
		line-height: 56rpx;
		border-radius: 28rpx;
		margin: 0;
		background: rgba(255, 255, 255, 0.85);
		color: #999;
		border: 2rpx solid rgba(255, 255, 255, 0.9);
		box-shadow: none;
	}

	.pet-meta {
		display: flex;
		gap: 12rpx;
		margin-bottom: 12rpx;
	}

	.meta-tag {
		background: rgba(255, 255, 255, 0.3);
		padding: 6rpx 16rpx;
		border-radius: 16rpx;
		font-size: 22rpx;
		font-weight: 600;
	}

	.pet-meta-detail {
		font-size: 24rpx;
		opacity: 0.9;
	}

	.tabs {
		display: flex;
		background-color: #fff;
		margin-bottom: 24rpx;
	}

	.tab {
		flex: 1;
		text-align: center;
		padding: 32rpx 0;
		font-size: 30rpx;
		font-weight: 600;
		color: #999;
		position: relative;
	}

	.tab.active {
		color: #ff6b6b;
	}

	.tab.active::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 60rpx;
		height: 6rpx;
		background: #ffb347;
		border-radius: 3rpx;
	}

	.records-section, .reminders-section {
		padding: 24rpx;
	}

	.record-list, .reminder-list {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}

	.record-card {
		background-color: #fff;
		border-radius: 24rpx;
		padding: 28rpx;
		box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.05);
	}

	.record-header {
		display: flex;
		align-items: center;
		margin-bottom: 16rpx;
	}

	.record-icon {
		font-size: 36rpx;
		margin-right: 12rpx;
	}

	.record-type {
		font-size: 28rpx;
		font-weight: 700;
		color: #333;
		flex: 1;
	}

	.record-time {
		font-size: 24rpx;
		color: #999;
	}

	.record-body {
		margin-bottom: 16rpx;
	}

	.record-remark {
		font-size: 26rpx;
		color: #666;
		line-height: 1.5;
	}

	.record-images {
		display: flex;
		gap: 12rpx;
	}

	.record-image {
		width: 140rpx;
		height: 140rpx;
		border-radius: 16rpx;
	}

	.reminder-card {
		background-color: #fff;
		border-radius: 24rpx;
		padding: 28rpx;
		display: flex;
		align-items: center;
		box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.05);
	}

	.reminder-icon {
		font-size: 44rpx;
		margin-right: 20rpx;
	}

	.reminder-info {
		flex: 1;
	}

	.reminder-title {
		font-size: 28rpx;
		font-weight: 700;
		color: #333;
		margin-bottom: 8rpx;
	}

	.reminder-date {
		font-size: 24rpx;
		color: #ff6b6b;
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

	.footer-actions {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 20rpx 40rpx;
		background-color: #fff;
		box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.06);
		display: flex;
		flex-direction: column;
		gap: 16rpx;
	}

	.action-btn {
		background: linear-gradient(135deg, #ffb347, #ff8c42);
		color: #fff;
		font-weight: bold;
		border-radius: 50rpx;
		font-size: 32rpx;
		border: none;
		box-shadow: 0 10rpx 25rpx rgba(255, 140, 66, 0.3);
	}

	.action-btn:active {
		opacity: 0.9;
		transform: scale(0.98);
	}

	.delete-btn {
		background: #f5f5f5;
		color: #999;
		font-weight: 600;
		box-shadow: none;
		border: 2rpx solid #eee;
	}
</style>
