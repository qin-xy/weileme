<template>
	<view class="container">
		<!-- 顶部背景 -->
		<view class="header-bg"></view>

		<view class="header">
			<view class="title">萌宠日记</view>
			<view class="subtitle">记录每一刻的陪伴</view>
		</view>

		<view class="main-content">
			<!-- 待提醒事项 -->
			<view class="reminder-section" v-if="upcomingReminders.length > 0">
				<view class="section-header">
					<text class="section-title">待提醒事项</text>
				</view>
				<scroll-view class="reminder-list" scroll-x>
					<view class="reminder-card" v-for="reminder in upcomingReminders" :key="reminder.id" @tap="goToReminder(reminder)">
						<text class="reminder-icon">{{getReminderIcon(reminder.type)}}</text>
						<view class="reminder-info">
							<text class="reminder-title">{{reminder.title}}</text>
							<text class="reminder-pet">{{reminder.petName}}</text>
						</view>
					</view>
				</scroll-view>
			</view>

			<!-- 快捷记录 -->
			<view class="quick-record-section">
				<view class="section-header">
					<text class="section-title">快捷记录</text>
				</view>
				<view class="quick-record-grid">
					<view class="quick-record-item" v-for="item in recordTypes" :key="item.type" @tap="quickRecord(item)">
						<text class="quick-record-icon">{{item.icon}}</text>
						<text class="quick-record-text">{{item.name}}</text>
					</view>
				</view>
			</view>

			<!-- 宠物列表 -->
			<view class="pets-section">
				<view class="section-header">
					<text class="section-title">我的宠物</text>
					<text class="add-pet-btn" @tap="navigateTo('/pages/pet/add')">+ 添加</text>
				</view>

				<view class="pet-list" v-if="pets.length > 0">
					<view class="pet-card" v-for="pet in pets" :key="pet.id" @tap="goToPetDetail(pet)">
						<view class="pet-avatar">
							<image :src="pet.avatar || '/static/default-pet.png'" mode="aspectFill"></image>
						</view>
						<view class="pet-info">
							<text class="pet-name">{{pet.name}}</text>
							<view class="pet-meta">
								<text class="pet-type">{{getPetTypeText(pet.type)}}</text>
								<text class="pet-age">{{calculateAge(pet.birthday)}}</text>
							</view>
						</view>
						<view class="pet-latest-record" v-if="pet.latestRecord">
							<text class="record-icon">{{getRecordIcon(pet.latestRecord.type)}}</text>
							<text class="record-text">{{formatRecordTime(pet.latestRecord.date)}}</text>
						</view>
					</view>
				</view>

				<view class="empty-state" v-if="pets.length === 0">
					<text class="empty-icon">🐾</text>
					<text class="empty-text">还没有添加宠物</text>
					<text class="empty-tip">点击右上角添加您的第一只宠物</text>
				</view>
			</view>

			<!-- 底部导航 -->
			<view class="tab-bar">
				<view class="tab-item active" @tap="currentTab = 0">
					<text class="tab-icon">🏠</text>
					<text class="tab-text">首页</text>
				</view>
				<view class="tab-item" @tap="currentTab = 1">
					<text class="tab-icon">📝</text>
					<text class="tab-text">记录</text>
				</view>
				<view class="tab-item" @tap="currentTab = 2">
					<text class="tab-icon">📊</text>
					<text class="tab-text">统计</text>
				</view>
				<view class="tab-item" @tap="currentTab = 3">
					<text class="tab-icon">⏰</text>
					<text class="tab-text">提醒</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				currentTab: 0,
				pets: [],
				upcomingReminders: [],
				recordTypes: [
					{ type: 'feed', name: '喂食', icon: '🍖' },
					{ type: 'water', name: '饮水', icon: '💧' },
					{ type: 'walk', name: '遛弯', icon: '🚶' },
					{ type: 'poop', name: '便便', icon: '💩' },
					{ type: 'pee', name: '嘘嘘', icon: '💦' },
					{ type: 'bath', name: '洗澡', icon: '🛁' },
					{ type: 'vaccine', name: '疫苗', icon: '💉' },
					{ type: 'deworm', name: '驱虫', icon: '💊' },
					{ type: 'medical', name: '就医', icon: '🏥' },
					{ type: 'play', name: '玩耍', icon: '🎾' },
					{ type: 'train', name: '训练', icon: '🎓' },
					{ type: 'snack', name: '零食', icon: '🍪' },
					{ type: 'mood', name: '心情', icon: '😊' },
					{ type: 'sleep', name: '睡觉', icon: '😴' },
					{ type: 'weight', name: '体重', icon: '⚖️' },
					{ type: 'other', name: '其他', icon: '📝' }
				]
			}
		},
		onLoad() {
			this.loadData();
		},
		onShow() {
			this.loadData();
		},
		watch: {
			currentTab(newVal) {
				switch(newVal) {
					case 0:
						break;
					case 1:
						uni.navigateTo({ url: '/pages/record/list' });
						break;
					case 2:
						uni.navigateTo({ url: '/pages/record/statistics' });
						break;
					case 3:
						uni.navigateTo({ url: '/pages/reminder/index' });
						break;
				}
			}
		},
		methods: {
			loadData() {
				// 从本地存储加载宠物数据
				this.pets = uni.getStorageSync('pets') || [];
				this.upcomingReminders = uni.getStorageSync('reminders') || [];

				// 为每个宠物加载最新记录
				const records = uni.getStorageSync('records') || [];
				this.pets.forEach(pet => {
					const petRecords = records.filter(r => r.petId === pet.id);
					if (petRecords.length > 0) {
						petRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
						pet.latestRecord = petRecords[0];
					}
				});
			},

			quickRecord(type) {
				const petId = this.pets.length === 1 ? this.pets[0].id : '';
				uni.navigateTo({
					url: `/pages/record/add?type=${type.type}&petId=${petId}`
				});
			},

			goToPetDetail(pet) {
				uni.navigateTo({
					url: `/pages/pet/detail?id=${pet.id}`
				});
			},

			goToReminder(reminder) {
				uni.navigateTo({
					url: `/pages/reminder/index`
				});
			},

			navigateTo(url) {
				uni.navigateTo({ url });
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

			formatRecordTime(date) {
				const now = new Date();
				const recordDate = new Date(date);
				const diffTime = Math.abs(now - recordDate);
				const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

				if (diffDays === 0) {
					const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
					if (diffHours === 0) {
						return '刚刚';
					}
					return `${diffHours}小时前`;
				} else if (diffDays === 1) {
					return '昨天';
				} else if (diffDays < 7) {
					return `${diffDays}天前`;
				} else {
					return `${recordDate.getMonth() + 1}/${recordDate.getDate()}`;
				}
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

	.header-bg {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 400rpx;
		background: linear-gradient(135deg, #ffb347, #ff6b6b);
		border-radius: 0 0 60rpx 60rpx;
		z-index: 0;
	}

	.header {
		position: relative;
		z-index: 1;
		padding: 100rpx 40rpx 40rpx;
		text-align: center;
	}

	.title {
		font-size: 56rpx;
		font-weight: 800;
		color: #fff;
		margin-bottom: 12rpx;
		letter-spacing: 4rpx;
	}

	.subtitle {
		font-size: 28rpx;
		color: rgba(255, 255, 255, 0.9);
	}

	.main-content {
		position: relative;
		z-index: 1;
		padding: 0 40rpx;
		margin-top: -20rpx;
	}

	/* 提醒区域 */
	.reminder-section {
		margin-bottom: 48rpx;
	}

	.reminder-list {
		white-space: nowrap;
		display: flex;
	}

	.reminder-card {
		display: inline-flex;
		align-items: center;
		background: linear-gradient(135deg, #fff3e0, #ffe0b2);
		border-radius: 24rpx;
		padding: 24rpx 32rpx;
		margin-right: 20rpx;
		box-shadow: 0 6rpx 20rpx rgba(255, 152, 0, 0.15);
	}

	.reminder-icon {
		font-size: 40rpx;
		margin-right: 16rpx;
	}

	.reminder-info {
		display: flex;
		flex-direction: column;
	}

	.reminder-title {
		font-size: 26rpx;
		font-weight: 600;
		color: #e65100;
		margin-bottom: 4rpx;
	}

	.reminder-pet {
		font-size: 22rpx;
		color: #ff9800;
	}

	/* 快捷记录区域 */
	.quick-record-section {
		margin-bottom: 48rpx;
	}

	.quick-record-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 20rpx;
	}

	.quick-record-item {
		background-color: #fff;
		border-radius: 20rpx;
		padding: 32rpx 16rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.05);
		transition: all 0.3s;
	}

	.quick-record-item:active {
		transform: scale(0.95);
	}

	.quick-record-icon {
		font-size: 48rpx;
		margin-bottom: 12rpx;
	}

	.quick-record-text {
		font-size: 22rpx;
		color: #666;
		font-weight: 500;
	}

	/* 宠物列表区域 */
	.pets-section {
		margin-bottom: 40rpx;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24rpx;
	}

	.section-title {
		font-size: 32rpx;
		font-weight: 700;
		color: #333;
	}

	.add-pet-btn {
		font-size: 26rpx;
		color: #ff6b6b;
		font-weight: 600;
		padding: 12rpx 24rpx;
		background: rgba(255, 107, 107, 0.1);
		border-radius: 20rpx;
	}

	.pet-list {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}

	.pet-card {
		background-color: #fff;
		border-radius: 28rpx;
		padding: 32rpx;
		display: flex;
		align-items: center;
		box-shadow: 0 6rpx 20rpx rgba(0,0,0,0.06);
	}

	.pet-avatar {
		width: 120rpx;
		height: 120rpx;
		border-radius: 50%;
		overflow: hidden;
		margin-right: 24rpx;
		background: linear-gradient(135deg, #ffe0b2, #ffcc80);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.pet-avatar image {
		width: 100%;
		height: 100%;
	}

	.pet-info {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.pet-name {
		font-size: 32rpx;
		font-weight: 700;
		color: #333;
		margin-bottom: 8rpx;
	}

	.pet-meta {
		display: flex;
		gap: 16rpx;
	}

	.pet-type {
		font-size: 24rpx;
		color: #ff6b6b;
		padding: 4rpx 12rpx;
		background: rgba(255, 107, 107, 0.1);
		border-radius: 12rpx;
	}

	.pet-age {
		font-size: 24rpx;
		color: #999;
	}

	.pet-latest-record {
		display: flex;
		align-items: center;
		background: linear-gradient(135deg, #e3f2fd, #bbdefb);
		padding: 16rpx 20rpx;
		border-radius: 20rpx;
	}

	.record-icon {
		font-size: 28rpx;
		margin-right: 8rpx;
	}

	.record-text {
		font-size: 22rpx;
		color: #1976d2;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 100rpx 0;
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

	/* 底部导航栏 */
	.tab-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: #fff;
		display: flex;
		box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.06);
		border-radius: 40rpx 40rpx 0 0;
		padding: 20rpx 0;
		z-index: 100;
	}

	.tab-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 8rpx 0;
	}

	.tab-icon {
		font-size: 44rpx;
		margin-bottom: 4rpx;
	}

	.tab-text {
		font-size: 22rpx;
		color: #999;
		font-weight: 500;
	}

	.tab-item.active .tab-text {
		color: #ff6b6b;
		font-weight: 700;
	}
</style>
