<template>
	<view class="container">
		<!-- 顶部导航 -->
		<view class="nav-header">
			<view class="nav-back" @tap="goBack">
				<text class="back-icon">‹</text>
			</view>
			<text class="nav-title">宠物详情</text>
			<view class="nav-actions">
				<text class="delete-btn" @tap="confirmDelete">删除</text>
			</view>
		</view>

		<view v-if="pet" class="content">
			<!-- 宠物信息卡片 -->
			<view class="pet-header-card">
				<view class="pet-avatar-wrap">
					<image :src="pet.avatar || '/static/default-pet.png'" mode="aspectFill" class="avatar"></image>
				</view>
				<view class="pet-basic-info">
					<text class="pet-name">{{pet.name}}</text>
					<view class="pet-tags">
						<text class="tag">{{getPetTypeText(pet.type)}}</text>
						<text class="tag" v-if="pet.breed">{{pet.breed}}</text>
						<text class="tag gender-tag" v-if="pet.gender">
							{{pet.gender === 'male' ? '♂ 公' : '♀ 母'}}
						</text>
					</view>
					<view class="pet-stats">
						<view class="stat-item" v-if="pet.birthday">
							<text class="stat-icon">🎂</text>
							<text class="stat-value">{{calculateAge(pet.birthday)}}</text>
						</view>
						<view class="stat-item" v-if="pet.weight">
							<text class="stat-icon">⚖️</text>
							<text class="stat-value">{{pet.weight}}kg</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 标签页 -->
			<view class="tabs">
				<view class="tab" :class="{active: activeTab === 0}" @tap="activeTab = 0">
					<text class="tab-text">记录</text>
					<view class="tab-indicator" v-if="activeTab === 0"></view>
				</view>
				<view class="tab" :class="{active: activeTab === 1}" @tap="activeTab = 1">
					<text class="tab-text">提醒</text>
					<view class="tab-indicator" v-if="activeTab === 1"></view>
				</view>
			</view>

			<!-- 记录列表 -->
			<view v-if="activeTab === 0" class="records-section">
				<view class="record-list" v-if="records.length > 0">
					<view class="record-card" v-for="record in records" :key="record.id" @tap="viewRecordDetail(record)">
						<view class="record-main">
							<view class="record-icon-wrap">
								<text class="record-icon">{{getRecordIcon(record.type)}}</text>
							</view>
							<view class="record-content">
								<view class="record-header-row">
									<text class="record-type">{{getRecordTypeName(record.type)}}</text>
									<text class="record-time">{{formatDateTime(record.date)}}</text>
								</view>
								<text class="record-remark" v-if="record.remark">{{record.remark}}</text>
							</view>
						</view>
						<view class="record-images" v-if="record.images && record.images.length > 0">
							<image v-for="(img, idx) in record.images.slice(0, 3)" :key="idx" :src="img" mode="aspectFill" class="record-image"></image>
						</view>
					</view>
				</view>
				<view class="empty-state-custom" v-else>
					<view class="empty-icon-wrap">
						<text class="empty-icon">📝</text>
					</view>
					<text class="empty-text">还没有记录</text>
					<text class="empty-tip">点击下方按钮添加第一条记录</text>
				</view>
			</view>

			<!-- 提醒列表 -->
			<view v-if="activeTab === 1" class="reminders-section">
				<view class="reminder-list" v-if="reminders.length > 0">
					<view class="reminder-card" v-for="reminder in reminders" :key="reminder.id">
						<view class="reminder-icon-wrap">
							<text class="reminder-icon">{{getReminderIcon(reminder.type)}}</text>
						</view>
						<view class="reminder-content">
							<text class="reminder-title">{{reminder.title}}</text>
							<view class="reminder-date">
								<text class="date-icon">📅</text>
								<text class="date-text">{{formatDate(reminder.targetDate)}}</text>
							</view>
						</view>
						<view class="reminder-status" :class="reminder.status">
							{{getReminderStatusText(reminder.status)}}
						</view>
					</view>
				</view>
				<view class="empty-state-custom" v-else>
					<view class="empty-icon-wrap">
						<text class="empty-icon">⏰</text>
					</view>
					<text class="empty-text">还没有提醒</text>
					<text class="empty-tip">添加记录时可以设置提醒</text>
				</view>
			</view>
		</view>

		<!-- 底部操作栏 -->
		<view class="footer-actions">
			<button class="action-btn" @tap="addRecord">
				<text class="btn-icon">+</text>
				<text class="btn-text">添加记录</text>
			</button>
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
			goBack() {
				uni.navigateBack();
			},

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
					confirmColor: '#C4786E',
					success: async (res) => {
						if (!res.confirm) return;
						try {
							uni.showLoading({ title: '删除中...' });
							const result = await deletePet(this.petId);
							if (result && result.success === false) {
								throw new Error('删除失败');
							}
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
					title: this.getRecordTypeName(record.type),
					content: record.remark || '无备注',
					showCancel: false
				});
			},

			getPetTypeText(type) {
				const types = {
					'dog': '狗狗',
					'cat': '猫咪',
					'bird': '鸟类',
					'other': '其他'
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

				const match = dateStr.match(/^(\d{1,2})月(\d{1,2})日\s*(\d{1,2})?:(\d{2})?$/);
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
		background: linear-gradient(180deg, #FAF7F2 0%, #F5F0E8 100%);
		padding-bottom: 140rpx;
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

	.nav-actions {
		width: 64rpx;
	}

	.delete-btn {
		font-size: 26rpx;
		color: rgba(255, 255, 255, 0.9);
		font-weight: 500;
	}

	/* 宠物信息卡片 */
	.pet-header-card {
		background: #FFFFFF;
		margin: -20rpx 32rpx 0;
		border-radius: 28rpx;
		padding: 32rpx;
		display: flex;
		align-items: center;
		box-shadow: 0 8rpx 32rpx rgba(61, 50, 41, 0.08);
		position: relative;
		z-index: 1;
	}

	.pet-avatar-wrap {
		width: 120rpx;
		height: 120rpx;
		border-radius: 50%;
		overflow: hidden;
		margin-right: 24rpx;
		border: 4rpx solid #F5F0E8;
		box-shadow: 0 4rpx 16rpx rgba(196, 167, 125, 0.2);
	}

	.avatar {
		width: 100%;
		height: 100%;
	}

	.pet-basic-info {
		flex: 1;
	}

	.pet-name {
		font-size: 36rpx;
		font-weight: 700;
		color: #3D3229;
		margin-bottom: 12rpx;
	}

	.pet-tags {
		display: flex;
		gap: 12rpx;
		margin-bottom: 16rpx;
	}

	.tag {
		font-size: 22rpx;
		color: #C4A77D;
		padding: 6rpx 16rpx;
		background: #F4E4D6;
		border-radius: 12rpx;
		font-weight: 500;
	}

	.gender-tag {
		background: linear-gradient(135deg, #C4A77D 0%, #A68B5B 100%);
		color: #FFFFFF;
	}

	.pet-stats {
		display: flex;
		gap: 24rpx;
	}

	.stat-item {
		display: flex;
		align-items: center;
		gap: 8rpx;
	}

	.stat-icon {
		font-size: 24rpx;
	}

	.stat-value {
		font-size: 24rpx;
		color: #6B5D4D;
		font-weight: 500;
	}

	/* 标签页 */
	.tabs {
		display: flex;
		background: #FFFFFF;
		margin: 24rpx 32rpx;
		border-radius: 20rpx;
		padding: 8rpx;
		box-shadow: 0 4rpx 16rpx rgba(61, 50, 41, 0.06);
	}

	.tab {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 20rpx 0;
		position: relative;
		border-radius: 16rpx;
		transition: all 0.2s ease;
	}

	.tab.active {
		background: #F5F0E8;
	}

	.tab-text {
		font-size: 28rpx;
		font-weight: 600;
		color: #9B8B7A;
	}

	.tab.active .tab-text {
		color: #C4A77D;
	}

	/* 记录列表 */
	.records-section {
		padding: 0 32rpx;
	}

	.record-list {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}

	.record-card {
		background: #FFFFFF;
		border-radius: 24rpx;
		padding: 28rpx;
		box-shadow: 0 4rpx 16rpx rgba(61, 50, 41, 0.06);
	}

	.record-main {
		display: flex;
		align-items: flex-start;
	}

	.record-icon-wrap {
		width: 64rpx;
		height: 64rpx;
		background: linear-gradient(135deg, #F4E4D6 0%, #E8D5C4 100%);
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 20rpx;
		flex-shrink: 0;
	}

	.record-icon {
		font-size: 32rpx;
	}

	.record-content {
		flex: 1;
	}

	.record-header-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8rpx;
	}

	.record-type {
		font-size: 28rpx;
		font-weight: 700;
		color: #3D3229;
	}

	.record-time {
		font-size: 22rpx;
		color: #9B8B7A;
	}

	.record-remark {
		font-size: 26rpx;
		color: #6B5D4D;
		line-height: 1.5;
	}

	.record-images {
		display: flex;
		gap: 12rpx;
		margin-top: 16rpx;
		padding-left: 84rpx;
	}

	.record-image {
		width: 120rpx;
		height: 120rpx;
		border-radius: 12rpx;
	}

	/* 提醒列表 */
	.reminders-section {
		padding: 0 32rpx;
	}

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
		box-shadow: 0 4rpx 16rpx rgba(61, 50, 41, 0.06);
	}

	.reminder-icon-wrap {
		width: 64rpx;
		height: 64rpx;
		background: linear-gradient(135deg, #C4A77D 0%, #A68B5B 100%);
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 20rpx;
		flex-shrink: 0;
	}

	.reminder-icon {
		font-size: 32rpx;
	}

	.reminder-content {
		flex: 1;
	}

	.reminder-title {
		font-size: 28rpx;
		font-weight: 700;
		color: #3D3229;
		margin-bottom: 8rpx;
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

	/* 空状态 */
	.empty-state-custom {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 100rpx 0;
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

	/* 底部操作栏 */
	.footer-actions {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 20rpx 32rpx 40rpx;
		background: #FFFFFF;
		box-shadow: 0 -4rpx 20rpx rgba(61, 50, 41, 0.08);
	}

	.action-btn {
		background: linear-gradient(135deg, #C4A77D 0%, #A68B5B 100%);
		color: #FFFFFF;
		font-weight: 600;
		border-radius: 50rpx;
		font-size: 30rpx;
		border: none;
		box-shadow: 0 8rpx 24rpx rgba(196, 167, 125, 0.35);
		height: 88rpx;
		line-height: 88rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12rpx;
	}

	.btn-icon {
		font-size: 36rpx;
		font-weight: 300;
	}

	.btn-text {
		font-size: 30rpx;
	}

	.action-btn:active {
		opacity: 0.95;
		transform: scale(0.98);
	}
</style>
