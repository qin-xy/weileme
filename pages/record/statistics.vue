<template>
	<view class="container">
		<!-- 顶部导航栏 -->
		<view class="nav-header">
			<view class="nav-back" @tap="goBack">
				<text class="back-icon">‹</text>
			</view>
			<text class="nav-title">统计</text>
			<view class="nav-placeholder"></view>
		</view>

		<view class="content">
			<!-- 本月统计卡片 -->
			<view class="stats-card">
				<view class="stats-header">
					<text class="stats-title">本月统计</text>
					<text class="stats-subtitle">{{currentMonth}}</text>
				</view>
				<view class="stats-grid">
					<view class="stats-item" v-for="item in monthlyStats" :key="item.type">
						<view class="stats-icon-wrap">
							<text class="stats-icon">{{item.icon}}</text>
						</view>
						<text class="stats-count">{{item.count}}</text>
						<text class="stats-label">{{item.name}}</text>
					</view>
				</view>
			</view>

			<!-- 按宠物统计 -->
			<view class="section-header">
				<view class="section-line"></view>
				<text class="section-title">按宠物统计</text>
			</view>
			
			<view class="pet-stats-list" v-if="petStats.length > 0">
				<view class="pet-stats-card" v-for="pet in petStats" :key="pet.id">
					<view class="pet-stats-info">
						<image :src="pet.avatar || '/static/default-pet.png'" mode="aspectFill" class="pet-avatar-small"></image>
						<view class="pet-text-info">
							<text class="pet-name">{{pet.name}}</text>
							<text class="pet-type">{{getPetTypeText(pet.type)}}</text>
						</view>
					</view>
					<view class="pet-stats-count">
						<text class="count-text">{{pet.recordCount}}</text>
						<text class="count-label">条记录</text>
					</view>
				</view>
			</view>

			<view class="empty-state-custom" v-if="pets.length === 0">
				<view class="empty-icon-wrap">
					<text class="empty-icon">📊</text>
				</view>
				<text class="empty-text">还没有数据</text>
				<text class="empty-tip">添加宠物和记录后查看统计</text>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				pets: [],
				records: [],
				monthlyStats: []
			}
		},
		computed: {
			currentMonth() {
				const now = new Date();
				return `${now.getFullYear()}年${now.getMonth() + 1}月`;
			},
			petStats() {
				return this.pets.map(pet => {
					const count = this.records.filter(r => r.petId === pet.id).length;
					return { ...pet, recordCount: count };
				});
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
				this.records = uni.getStorageSync('records') || [];
				this.calculateMonthlyStats();
			},

			calculateMonthlyStats() {
				const now = new Date();
				const currentMonth = now.getMonth();
				const currentYear = now.getFullYear();

				const monthRecords = this.records.filter(record => {
					const recordDate = new Date(record.date);
					return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
				});

				const typeCounts = {};
				const types = [
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
				];

				types.forEach(t => typeCounts[t.type] = 0);

				monthRecords.forEach(record => {
					if (typeCounts[record.type] !== undefined) {
						typeCounts[record.type]++;
					}
				});

				this.monthlyStats = types.map(t => ({
					...t,
					count: typeCounts[t.type]
				})).filter(t => t.count > 0);

				if (this.monthlyStats.length === 0) {
					this.monthlyStats = types.slice(0, 8).map(t => ({ ...t, count: 0 }));
				}
			},

			getPetTypeText(type) {
				const types = {
					'dog': '狗狗',
					'cat': '猫咪',
					'bird': '鸟类',
					'other': '其他'
				};
				return types[type] || type;
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

	/* 统计卡片 */
	.stats-card {
		background: linear-gradient(135deg, #C4A77D 0%, #A68B5B 100%);
		border-radius: 28rpx;
		padding: 40rpx;
		margin-bottom: 40rpx;
		box-shadow: 0 8rpx 32rpx rgba(196, 167, 125, 0.3);
	}

	.stats-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 32rpx;
	}

	.stats-title {
		font-size: 32rpx;
		font-weight: 700;
		color: #FFFFFF;
	}

	.stats-subtitle {
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.8);
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 20rpx;
	}

	.stats-item {
		background: rgba(255, 255, 255, 0.15);
		border-radius: 20rpx;
		padding: 24rpx 16rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.stats-icon-wrap {
		width: 56rpx;
		height: 56rpx;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 12rpx;
	}

	.stats-icon {
		font-size: 32rpx;
	}

	.stats-count {
		font-size: 36rpx;
		font-weight: 800;
		color: #FFFFFF;
		margin-bottom: 4rpx;
	}

	.stats-label {
		font-size: 20rpx;
		color: rgba(255, 255, 255, 0.85);
	}

	/* 区块标题 */
	.section-header {
		display: flex;
		align-items: center;
		margin-bottom: 24rpx;
	}

	.section-line {
		width: 6rpx;
		height: 32rpx;
		background: linear-gradient(180deg, #C4A77D 0%, #A68B5B 100%);
		border-radius: 3rpx;
		margin-right: 16rpx;
	}

	.section-title {
		font-size: 32rpx;
		font-weight: 700;
		color: #3D3229;
	}

	/* 宠物统计列表 */
	.pet-stats-list {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}

	.pet-stats-card {
		background: #FFFFFF;
		border-radius: 24rpx;
		padding: 28rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		box-shadow: 0 4rpx 16rpx rgba(61, 50, 41, 0.06);
	}

	.pet-stats-info {
		display: flex;
		align-items: center;
	}

	.pet-avatar-small {
		width: 80rpx;
		height: 80rpx;
		border-radius: 50%;
		margin-right: 20rpx;
		border: 3rpx solid #F5F0E8;
	}

	.pet-text-info {
		display: flex;
		flex-direction: column;
	}

	.pet-name {
		font-size: 30rpx;
		font-weight: 700;
		color: #3D3229;
		margin-bottom: 6rpx;
	}

	.pet-type {
		font-size: 22rpx;
		color: #9B8B7A;
	}

	.pet-stats-count {
		text-align: right;
	}

	.count-text {
		font-size: 40rpx;
		font-weight: 800;
		color: #C4A77D;
	}

	.count-label {
		font-size: 22rpx;
		color: #9B8B7A;
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
