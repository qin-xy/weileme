<template>
	<view class="container">
		<!-- 顶部沉浸式背景 -->
		<view class="header-bg">
			<view class="user-info">
				<view class="greeting-icon-box">☀️</view>
				<text class="user-name">哈喽，铲屎官</text>
			</view>
			<view class="title-area">
				<view class="title">萌宠日记</view>
				<view class="subtitle">记录每一份纯粹的爱</view>
			</view>
		</view>

		<view class="main-content">
			<!-- 待提醒事项 - 采用大圆角卡片 -->
			<view class="reminder-section" v-if="upcomingReminders.length > 0">
				<view class="section-header">
					<text class="section-title">重要事项</text>
					<text class="view-all" @tap="navigateTo('/pages/reminder/index')">查看全部</text>
				</view>
				<scroll-view class="reminder-list" scroll-x>
					<view class="reminder-card" v-for="reminder in upcomingReminders" :key="reminder.id" @tap="goToReminder(reminder)">
						<view class="reminder-icon-box">
							<text class="reminder-icon">{{getReminderIcon(reminder.type)}}</text>
						</view>
						<view class="reminder-info">
							<text class="reminder-title">{{reminder.title}}</text>
							<text class="reminder-pet">{{reminder.petName}}</text>
						</view>
					</view>
				</scroll-view>
			</view>

			<!-- 快捷记录 - 采用现代网格 -->
			<view class="quick-record-section">
				<view class="section-header">
					<text class="section-title">快捷记录</text>
				</view>
				<view class="quick-record-grid">
					<view class="quick-record-item" v-for="item in recordTypes.slice(0, 8)" :key="item.type" @tap="quickRecord(item)">
						<view class="item-icon-circle">{{item.icon}}</view>
						<text class="quick-record-text">{{item.name}}</text>
					</view>
				</view>
			</view>

			<!-- 宠物列表 - 破局感卡片设计 -->
			<view class="pets-section">
				<view class="section-header">
					<text class="section-title">我的宠物</text>
					<view class="add-pet-btn" @tap="navigateTo('/pages/pet/add')">
						<text>+</text>
					</view>
				</view>

				<view class="pet-list" v-if="pets.length > 0">
					<view class="pet-card" v-for="pet in pets" :key="pet.id" @tap="goToPetDetail(pet)">
						<view class="pet-avatar-box">
							<image class="pet-img" :src="pet.avatar || '/static/default-pet.png'" mode="aspectFill"></image>
						</view>
						<view class="pet-info-content">
							<view class="pet-name-row">
								<text class="pet-name">{{pet.name}}</text>
								<text class="pet-type-tag">{{getPetTypeText(pet.type)}}</text>
							</view>
							<text class="pet-age-text">{{calculateAge(pet.birthday)}}</text>
							<view class="pet-latest-timeline" v-if="pet.latestRecord">
								<view class="timeline-dot"></view>
								<text class="timeline-text">{{getRecordIcon(pet.latestRecord.type)}} {{formatRecordTime(pet.latestRecord.date)}}</text>
							</view>
						</view>
					</view>
				</view>

				<view class="empty-state" v-if="pets.length === 0">
					<text class="empty-icon">🐶</text>
					<view class="empty-desc">
						<text class="empty-text">还没有小伙伴</text>
						<text class="empty-tip">开启日记的第一步</text>
					</view>
					<button class="primary-btn" @tap="navigateTo('/pages/pet/add')">添加宠物</button>
				</view>
			</view>
		</view>

		<!-- 悬浮胶囊底部导航 -->
		<view class="tab-bar-container">
			<view class="tab-bar">
				<view class="tab-item" :class="{active: currentTab === 0}" @tap="currentTab = 0">
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
	import { getPets, getRecords, getReminders } from '../../utils/api.js';
	import { getUserId } from '../../utils/user.js';

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
				if (newVal === 0) return;
				const paths = ['/pages/index/index', '/pages/record/list', '/pages/record/statistics', '/pages/reminder/index'];
				uni.navigateTo({ url: paths[newVal] });
			}
		},
		methods: {
			async loadData() {
				try {
					const userId = await getUserId();
					const [pets, reminders, records] = await Promise.all([
						getPets(userId),
						getReminders({ userId, status: 'pending' }),
						getRecords({ userId })
					]);

					this.pets = pets || [];
					this.upcomingReminders = reminders || [];

					this.pets.forEach(pet => {
						const petRecords = (records || []).filter(r => r.petId === pet.id);
						if (petRecords.length > 0) {
							petRecords.sort((a, b) => this.parseRecordDate(b.date) - this.parseRecordDate(a.date));
							pet.latestRecord = petRecords[0];
						}
					});
				} catch (error) {
					console.error(error);
				}
			},
			quickRecord(item) {
				const petId = this.pets.length === 1 ? this.pets[0].id : '';
				uni.navigateTo({ url: `/pages/record/add?type=${item.type}&petId=${petId}` });
			},
			goToPetDetail(pet) {
				uni.navigateTo({ url: `/pages/pet/detail?id=${pet.id}` });
			},
			goToReminder(reminder) {
				uni.navigateTo({ url: `/pages/reminder/index` });
			},
			navigateTo(url) {
				uni.navigateTo({ url });
			},
			getPetTypeText(type) {
				const types = { 'dog': '狗狗', 'cat': '猫咪', 'bird': '鸟类', 'other': '其他' };
				return types[type] || type;
			},
			calculateAge(birthday) {
				if (!birthday) return '快乐成长中';
				const birth = new Date(birthday);
				const now = new Date();
				const diffTime = Math.abs(now - birth);
				const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
				if (diffDays < 30) return `${diffDays}天`;
				if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月`;
				return `${Math.floor(diffDays / 365)}岁`;
			},
			getRecordIcon(type) {
				const icons = { 'feed': '🍖', 'walk': '🚶', 'bath': '🛁', 'vaccine': '💉', 'deworm': '💊', 'medical': '🏥', 'sleep': '😴', 'weight': '⚖️' };
				return icons[type] || '📦';
			},
			getReminderIcon(type) {
				const icons = { 'vaccine': '💉', 'deworm': '💊', 'bath': '🛁', 'medical': '🏥' };
				return icons[type] || '⏰';
			},
			parseRecordDate(dateStr) {
				const d = new Date(dateStr);
				return isNaN(d.getTime()) ? new Date(0) : d;
			},
			formatRecordTime(dateStr) {
				const recordDate = this.parseRecordDate(dateStr);
				const now = new Date();
				const diff = (now - recordDate) / 1000;
				if (diff < 3600) return '刚刚';
				if (diff < 86400) return Math.floor(diff / 3600) + '小时前';
				return (recordDate.getMonth() + 1) + '/' + recordDate.getDate();
			}
		}
	}
</script>

<style>
	.container {
		min-height: 100vh;
		background-color: var(--bg-main);
		padding-bottom: 150rpx;
	}

	.header-bg {
		background: linear-gradient(180deg, var(--bg-header) 0%, var(--bg-main) 100%);
		padding: 80rpx 40rpx 40rpx;
		border-radius: 0 0 80rpx 80rpx;
		animation: slideDown 0.8s cubic-bezier(0.23, 1, 0.32, 1);
	}

	.greeting-icon-box {
		width: 84rpx;
		height: 84rpx;
		background-color: #FFF;
		border-radius: var(--radius-full);
		margin-right: 20rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 40rpx;
		box-shadow: 0 10rpx 20rpx rgba(183, 148, 111, 0.15);
		border: 4rpx solid var(--primary);
		animation: sunshine 3s ease-in-out infinite;
	}

	.user-name {
		font-size: 28rpx;
		color: var(--text-muted);
		font-weight: 500;
	}

	.title-area {
		padding-top: 10rpx;
		animation: fadeIn 1s ease-out 0.2s both;
	}

	.title {
		font-size: 48rpx;
		font-weight: 800;
		color: var(--text-main);
		margin-bottom: 4rpx;
	}

	.subtitle {
		font-size: 26rpx;
		color: var(--text-muted);
	}

	.main-content {
		padding: 0 40rpx;
		margin-top: -40rpx;
	}

	.reminder-section { animation: slideUp 0.8s ease-out 0.3s both; }
	.quick-record-section { animation: slideUp 0.8s ease-out 0.4s both; }
	.pets-section { animation: slideUp 0.8s ease-out 0.5s both; }

	@keyframes sunshine {
		0%, 100% { transform: scale(1); box-shadow: 0 10rpx 20rpx rgba(255, 182, 41, 0.2); }
		50% { transform: scale(1.1); box-shadow: 0 15rpx 30rpx rgba(255, 182, 41, 0.4); }
	}

	@keyframes slideDown {
		from { transform: translateY(-100%); opacity: 0; }
		to { transform: translateY(0); opacity: 1; }
	}

	@keyframes slideUp {
		from { transform: translateY(50rpx); opacity: 0; }
		to { transform: translateY(0); opacity: 1; }
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateX(-20rpx); }
		to { opacity: 1; transform: translateX(0); }
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16rpx;
		padding-top: 24rpx;
	}

	.section-title {
		font-size: 36rpx;
		font-weight: 700;
		color: var(--text-main);
	}

	.view-all {
		font-size: 24rpx;
		color: var(--text-muted);
	}

	/* 提醒卡片 */
	.reminder-list {
		white-space: nowrap;
		margin: 0 -10rpx;
	}

	.reminder-card {
		display: inline-flex;
		align-items: center;
		background-color: #FFF;
		border-radius: var(--radius-md);
		padding: 20rpx 28rpx;
		margin: 8rpx;
		box-shadow: var(--shadow-soft);
	}

	.reminder-icon-box {
		width: 80rpx;
		height: 80rpx;
		background-color: #FDF4E5;
		border-radius: var(--radius-sm);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 20rpx;
	}

	.reminder-icon {
		font-size: 40rpx;
	}

	.reminder-info {
		display: flex;
		flex-direction: column;
	}

	.reminder-title {
		font-size: 28rpx;
		font-weight: 700;
		color: var(--text-main);
		margin-bottom: 4rpx;
	}

	.reminder-pet {
		font-size: 22rpx;
		color: var(--secondary);
	}

	/* 快捷记录网格 */
	.quick-record-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 16rpx;
		background-color: #FFF;
		padding: 24rpx;
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-soft);
	}

	.quick-record-item {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.item-icon-circle {
		width: 88rpx;
		height: 88rpx;
		background-color: var(--bg-main);
		border-radius: var(--radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 40rpx;
		margin-bottom: 8rpx;
		transition: transform 0.2s;
	}

	.quick-record-item:active .item-icon-circle {
		transform: scale(0.9);
		background-color: var(--primary);
	}

	.quick-record-text {
		font-size: 24rpx;
		color: var(--text-main);
		font-weight: 500;
	}

	/* 宠物列表 */
	.add-pet-btn {
		width: 60rpx;
		height: 60rpx;
		background-color: var(--primary);
		border-radius: var(--radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 40rpx;
		color: #FFF;
		box-shadow: 0 4rpx 12rpx rgba(255, 182, 41, 0.4);
	}

	.pet-card {
		background-color: #FFF;
		border-radius: var(--radius-lg);
		padding: 24rpx;
		display: flex;
		align-items: center;
		margin-bottom: 16rpx;
		box-shadow: var(--shadow-soft);
		position: relative;
		overflow: hidden;
	}

	.pet-avatar-box {
		width: 120rpx;
		height: 120rpx;
		border-radius: var(--radius-md);
		overflow: hidden;
		margin-right: 24rpx;
		background-color: var(--bg-header);
	}

	.pet-img {
		width: 100%;
		height: 100%;
	}

	.pet-info-content {
		flex: 1;
	}

	.pet-name-row {
		display: flex;
		align-items: center;
		margin-bottom: 8rpx;
	}

	.pet-name {
		font-size: 34rpx;
		font-weight: 800;
		color: var(--text-main);
		margin-right: 16rpx;
	}

	.pet-type-tag {
		font-size: 20rpx;
		padding: 4rpx 12rpx;
		background-color: var(--secondary-light);
		color: var(--secondary);
		border-radius: var(--radius-full);
		font-weight: 600;
	}

	.pet-age-text {
		font-size: 24rpx;
		color: var(--text-muted);
		margin-bottom: 16rpx;
		display: block;
	}

	.pet-latest-timeline {
		display: flex;
		align-items: center;
		padding-top: 10rpx;
		border-top: 2rpx solid var(--bg-main);
	}

	.timeline-dot {
		width: 12rpx;
		height: 12rpx;
		background-color: var(--primary);
		border-radius: var(--radius-full);
		margin-right: 12rpx;
	}

	.timeline-text {
		font-size: 22rpx;
		color: var(--text-muted);
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 60rpx 40rpx;
		background-color: #FFF;
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-soft);
	}

	.empty-icon {
		font-size: 100rpx;
		margin-bottom: 20rpx;
	}

	.empty-desc {
		text-align: center;
		margin-bottom: 40rpx;
	}

	.empty-text {
		font-size: 32rpx;
		font-weight: 700;
		color: var(--text-main);
		display: block;
	}

	.empty-tip {
		font-size: 24rpx;
		color: var(--text-muted);
	}

	.primary-btn {
		width: 100%;
		height: 90rpx;
		background-color: var(--primary);
		color: var(--text-main);
		border-radius: var(--radius-full);
		font-size: 30rpx;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
	}

	/* 悬浮底部导航 - 改为更温馨的拿铁色调 */
	.tab-bar-container {
		position: fixed;
		bottom: 50rpx;
		left: 60rpx;
		right: 60rpx;
		z-index: 1000;
	}

	.tab-bar {
		background-color: rgba(255, 255, 255, 0.95);
		display: flex;
		border-radius: var(--radius-full);
		padding: 10rpx;
		box-shadow: 0 15rpx 40rpx rgba(183, 148, 111, 0.2);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.5);
	}

	.tab-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 90rpx;
		transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
		position: relative;
	}

	.tab-icon {
		font-size: 40rpx;
		margin-bottom: 2rpx;
		color: var(--text-muted);
	}

	.tab-text {
		font-size: 18rpx;
		color: var(--text-muted);
		font-weight: 500;
	}

	.tab-item.active {
		background-color: var(--primary);
		border-radius: var(--radius-full);
		transform: scale(1.05);
	}

	.tab-item.active .tab-icon,
	.tab-item.active .tab-text {
		color: var(--text-main);
		font-weight: 800;
	}
</style>
