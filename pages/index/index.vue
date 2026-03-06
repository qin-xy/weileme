<template>
	<view class="container">
		<!-- 顶部背景 -->
		<view class="header-bg">
			<view class="header-pattern"></view>
		</view>

		<view class="header anim-slide-down">
			<view class="title">萌宠日记</view>
			<view class="subtitle">记录每一刻的陪伴</view>
		</view>

		<view class="main-content anim-slide-up delay-1">
			<!-- 待提醒事项 -->
			<view class="reminder-section" v-if="upcomingReminders.length > 0">
				<view class="section-header">
					<text class="section-title">待提醒事项</text>
					<text class="view-all" @tap="navigateTo('/pages/reminder/index')">查看全部</text>
				</view>
				<scroll-view class="reminder-list" scroll-x>
					<view class="reminder-card card-enter" v-for="(reminder, index) in upcomingReminders" :key="reminder.id" @tap="goToReminder(reminder)" :style="{animationDelay: index * 0.05 + 's'}">
						<view class="reminder-icon-wrap">
							<text class="reminder-icon">{{getReminderIcon(reminder.type)}}</text>
						</view>
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
					<view class="quick-record-item card-enter" v-for="(item, index) in recordTypes.slice(0, 8)" :key="item.type" @tap="quickRecord(item)" :style="{animationDelay: (index * 0.03) + 's'}">
						<view class="icon-wrap">
							<text class="quick-record-icon">{{item.icon}}</text>
						</view>
						<text class="quick-record-text">{{item.name}}</text>
					</view>
				</view>
			</view>

			<!-- 宠物列表 -->
			<view class="pets-section">
				<view class="section-header">
					<text class="section-title">我的宠物</text>
					<view class="add-pet-btn anim-breathe" @tap="navigateTo('/pages/pet/add')">
						<text class="add-icon">+</text>
						<text class="add-text">添加</text>
					</view>
				</view>

				<view class="pet-list" v-if="pets.length > 0">
					<view class="pet-card card-enter" v-for="(pet, index) in pets" :key="pet.id" @tap="goToPetDetail(pet)" :style="{animationDelay: (index * 0.08) + 's'}">
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
						<view class="arrow-icon" v-else>
							<text class="arrow">›</text>
						</view>
					</view>
				</view>

				<view class="empty-state-custom" v-if="pets.length === 0">
					<view class="empty-icon-wrap">
						<text class="empty-icon">🐶</text>
					</view>
					<text class="empty-text">还没有添加宠物</text>
					<text class="empty-tip">点击上方按钮添加您的第一只宠物</text>
				</view>
			</view>
		</view>

		<!-- 底部导航 -->
		<view class="tab-bar anim-slide-up delay-2">
			<view class="tab-item" :class="{active: currentTab === 0}" @tap="switchTab(0)">
				<view class="tab-icon-wrap">
					<text class="tab-icon">🏠</text>
				</view>
				<text class="tab-text">首页</text>
			</view>
			<view class="tab-item" :class="{active: currentTab === 1}" @tap="switchTab(1)">
				<view class="tab-icon-wrap">
					<text class="tab-icon">📝</text>
				</view>
				<text class="tab-text">记录</text>
			</view>
			<view class="tab-item center-btn" @tap="quickAdd">
				<view class="center-icon-wrap anim-float">
					<text class="center-icon">+</text>
				</view>
			</view>
			<view class="tab-item" :class="{active: currentTab === 2}" @tap="switchTab(2)">
				<view class="tab-icon-wrap">
					<text class="tab-icon">📊</text>
				</view>
				<text class="tab-text">统计</text>
			</view>
			<view class="tab-item" :class="{active: currentTab === 3}" @tap="switchTab(3)">
				<view class="tab-icon-wrap">
					<text class="tab-icon">⏰</text>
				</view>
				<text class="tab-text">提醒</text>
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
					this.pets = [];
					this.upcomingReminders = [];
					uni.showToast({ title: error.message || '加载失败', icon: 'none' });
				}
			},

			switchTab(index) {
				this.currentTab = index;
				switch(index) {
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
			},

			quickAdd() {
				if (this.pets.length === 0) {
					uni.navigateTo({ url: '/pages/pet/add' });
				} else {
					uni.navigateTo({ url: '/pages/record/add' });
				}
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

			formatRecordTime(dateStr) {
				const now = new Date();
				const recordDate = this.parseRecordDate(dateStr);
				if (isNaN(recordDate.getTime())) {
					return dateStr || '';
				}
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
		background: linear-gradient(180deg, #FAF7F2 0%, #F5F0E8 100%);
		padding-bottom: 140rpx;
	}

	/* 顶部背景 */
	.header-bg {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 420rpx;
		background: linear-gradient(135deg, #C4A77D 0%, #A68B5B 100%);
		border-radius: 0 0 48rpx 48rpx;
		overflow: hidden;
	}

	.header-pattern {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image: radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
		                  radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 40%);
	}

	.header {
		position: relative;
		z-index: 1;
		padding: 100rpx 40rpx 50rpx;
		text-align: center;
	}

	.title {
		font-size: 52rpx;
		font-weight: 700;
		color: #FFFFFF;
		margin-bottom: 12rpx;
		letter-spacing: 4rpx;
		text-shadow: 0 2rpx 8rpx rgba(0,0,0,0.1);
	}

	.subtitle {
		font-size: 26rpx;
		color: rgba(255, 255, 255, 0.85);
		font-weight: 400;
	}

	.main-content {
		position: relative;
		z-index: 1;
		padding: 0 32rpx;
		margin-top: -20rpx;
	}

	/* 区块标题 */
	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24rpx;
	}

	.section-title {
		font-size: 32rpx;
		font-weight: 700;
		color: #3D3229;
	}

	.view-all {
		font-size: 24rpx;
		color: #C4A77D;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.view-all:active {
		transform: scale(0.95);
		opacity: 0.8;
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
		background: linear-gradient(135deg, #FFFBF7 0%, #F5F0E8 100%);
		border-radius: 24rpx;
		padding: 28rpx 32rpx;
		margin-right: 20rpx;
		box-shadow: 0 4rpx 16rpx rgba(61, 50, 41, 0.08);
		border: 2rpx solid rgba(196, 167, 125, 0.15);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.reminder-card:active {
		transform: scale(0.95);
		box-shadow: 0 2rpx 8rpx rgba(61, 50, 41, 0.04);
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
		transition: all 0.3s ease;
	}

	.reminder-card:active .reminder-icon-wrap {
		transform: scale(0.9) rotate(10deg);
	}

	.reminder-icon {
		font-size: 36rpx;
	}

	.reminder-info {
		display: flex;
		flex-direction: column;
	}

	.reminder-title {
		font-size: 28rpx;
		font-weight: 600;
		color: #3D3229;
		margin-bottom: 6rpx;
	}

	.reminder-pet {
		font-size: 22rpx;
		color: #9B8B7A;
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
		background: #FFFFFF;
		border-radius: 24rpx;
		padding: 28rpx 16rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		box-shadow: 0 4rpx 16rpx rgba(61, 50, 41, 0.06);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.quick-record-item:active {
		transform: scale(0.92) translateY(-4rpx);
		box-shadow: 0 8rpx 24rpx rgba(196, 167, 125, 0.2);
	}

	.icon-wrap {
		width: 80rpx;
		height: 80rpx;
		background: linear-gradient(135deg, #F4E4D6 0%, #E8D5C4 100%);
		border-radius: 20rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 16rpx;
		transition: all 0.3s ease;
	}

	.quick-record-item:active .icon-wrap {
		transform: scale(1.1) rotate(-5deg);
		background: linear-gradient(135deg, #C4A77D 0%, #A68B5B 100%);
	}

	.quick-record-item:active .quick-record-icon {
		filter: brightness(0) invert(1);
	}

	.quick-record-icon {
		font-size: 40rpx;
		transition: all 0.3s ease;
	}

	.quick-record-text {
		font-size: 22rpx;
		color: #6B5D4D;
		font-weight: 500;
	}

	/* 宠物列表区域 */
	.pets-section {
		margin-bottom: 40rpx;
	}

	.add-pet-btn {
		display: flex;
		align-items: center;
		background: linear-gradient(135deg, #C4A77D 0%, #A68B5B 100%);
		padding: 12rpx 24rpx;
		border-radius: 28rpx;
		transition: all 0.3s ease;
	}

	.add-pet-btn:active {
		transform: scale(0.95);
		box-shadow: 0 4rpx 16rpx rgba(196, 167, 125, 0.3);
	}

	.add-icon {
		font-size: 28rpx;
		color: #FFFFFF;
		margin-right: 8rpx;
		font-weight: 600;
		transition: transform 0.3s ease;
	}

	.add-pet-btn:active .add-icon {
		transform: rotate(90deg);
	}

	.add-text {
		font-size: 24rpx;
		color: #FFFFFF;
		font-weight: 500;
	}

	.pet-list {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}

	.pet-card {
		background: #FFFFFF;
		border-radius: 28rpx;
		padding: 28rpx;
		display: flex;
		align-items: center;
		box-shadow: 0 4rpx 20rpx rgba(61, 50, 41, 0.06);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.pet-card:active {
		transform: translateX(12rpx) scale(0.98);
		box-shadow: 0 8rpx 32rpx rgba(61, 50, 41, 0.1);
	}

	.pet-avatar {
		width: 100rpx;
		height: 100rpx;
		border-radius: 50%;
		overflow: hidden;
		margin-right: 24rpx;
		background: linear-gradient(135deg, #F4E4D6 0%, #E8D5C4 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		border: 4rpx solid #F5F0E8;
		transition: all 0.3s ease;
	}

	.pet-card:active .pet-avatar {
		transform: scale(1.1);
		border-color: #C4A77D;
	}

	.pet-avatar image {
		width: 100%;
		height: 100%;
		transition: transform 0.3s ease;
	}

	.pet-card:active .pet-avatar image {
		transform: scale(1.1);
	}

	.pet-info {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.pet-name {
		font-size: 32rpx;
		font-weight: 700;
		color: #3D3229;
		margin-bottom: 10rpx;
		transition: color 0.3s ease;
	}

	.pet-card:active .pet-name {
		color: #C4A77D;
	}

	.pet-meta {
		display: flex;
		gap: 16rpx;
		align-items: center;
	}

	.pet-type {
		font-size: 22rpx;
		color: #C4A77D;
		padding: 6rpx 16rpx;
		background: #F4E4D6;
		border-radius: 12rpx;
		font-weight: 500;
	}

	.pet-age {
		font-size: 22rpx;
		color: #9B8B7A;
	}

	.pet-latest-record {
		display: flex;
		align-items: center;
		background: linear-gradient(135deg, #F4E4D6 0%, #E8D5C4 100%);
		padding: 16rpx 20rpx;
		border-radius: 16rpx;
		margin-left: 16rpx;
		transition: all 0.3s ease;
	}

	.pet-card:active .pet-latest-record {
		transform: scale(1.05);
		background: linear-gradient(135deg, #C4A77D 0%, #A68B5B 100%);
	}

	.pet-card:active .pet-latest-record .record-icon,
	.pet-card:active .pet-latest-record .record-text {
		color: #FFFFFF;
	}

	.record-icon {
		font-size: 28rpx;
		margin-right: 8rpx;
		transition: all 0.3s ease;
	}

	.record-text {
		font-size: 20rpx;
		color: #6B5D4D;
		font-weight: 500;
		transition: all 0.3s ease;
	}

	.arrow-icon {
		margin-left: 16rpx;
		transition: all 0.3s ease;
	}

	.pet-card:active .arrow-icon {
		transform: translateX(8rpx);
	}

	.arrow {
		font-size: 40rpx;
		color: #B8A99A;
		transition: color 0.3s ease;
	}

	.pet-card:active .arrow {
		color: #C4A77D;
	}

	/* 空状态 */
	.empty-state-custom {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 80rpx 0;
		animation: fadeIn 0.6s ease-out;
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
		animation: float 3s ease-in-out infinite;
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

	/* 底部导航栏 */
	.tab-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: #FFFFFF;
		display: flex;
		box-shadow: 0 -4rpx 20rpx rgba(61, 50, 41, 0.08);
		border-radius: 40rpx 40rpx 0 0;
		padding: 16rpx 0 32rpx;
		z-index: 100;
	}

	.tab-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 8rpx 0;
		transition: all 0.3s ease;
	}

	.tab-item:active {
		transform: scale(0.9);
	}

	.tab-icon-wrap {
		width: 56rpx;
		height: 56rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 6rpx;
		border-radius: 16rpx;
		transition: all 0.3s ease;
	}

	.tab-item.active .tab-icon-wrap {
		background: linear-gradient(135deg, #C4A77D 0%, #A68B5B 100%);
		animation: pulse 0.3s ease;
	}

	.tab-icon {
		font-size: 40rpx;
		transition: all 0.3s ease;
	}

	.tab-item.active .tab-icon {
		filter: brightness(0) invert(1);
	}

	.tab-text {
		font-size: 20rpx;
		color: #9B8B7A;
		font-weight: 500;
		transition: all 0.3s ease;
	}

	.tab-item.active .tab-text {
		color: #C4A77D;
		font-weight: 600;
	}

	/* 中间添加按钮 */
	.center-btn {
		position: relative;
		top: -30rpx;
	}

	.center-icon-wrap {
		width: 100rpx;
		height: 100rpx;
		background: linear-gradient(135deg, #C4A77D 0%, #A68B5B 100%);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8rpx 24rpx rgba(196, 167, 125, 0.4);
		border: 6rpx solid #FAF7F2;
		transition: all 0.3s ease;
	}

	.center-btn:active .center-icon-wrap {
		transform: scale(0.9);
		box-shadow: 0 4rpx 12rpx rgba(196, 167, 125, 0.3);
	}

	.center-icon {
		font-size: 56rpx;
		color: #FFFFFF;
		font-weight: 300;
		transition: transform 0.3s ease;
	}

	.center-btn:active .center-icon {
		transform: rotate(90deg);
	}
</style>
