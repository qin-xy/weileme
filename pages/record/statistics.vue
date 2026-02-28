<template>
	<view class="container">
		<view class="stats-card">
			<view class="stats-header">
				<text class="stats-title">本月统计</text>
			</view>
			<view class="stats-grid">
				<view class="stats-item" v-for="item in monthlyStats" :key="item.type">
					<text class="stats-icon">{{item.icon}}</text>
					<text class="stats-count">{{item.count}}</text>
					<text class="stats-label">{{item.name}}</text>
				</view>
			</view>
		</view>

		<view class="section-title">按宠物统计</view>
		<view class="pet-stats-list">
			<view class="pet-stats-card" v-for="pet in petStats" :key="pet.id">
				<view class="pet-stats-info">
					<image :src="pet.avatar || '/static/default-pet.png'" mode="aspectFill" class="pet-avatar-small"></image>
					<text class="pet-name">{{pet.name}}</text>
				</view>
				<view class="pet-stats-count">
					<text class="count-text">{{pet.recordCount}}</text>
					<text class="count-label">条记录</text>
				</view>
			</view>
		</view>

		<view class="empty-state" v-if="pets.length === 0">
			<text class="empty-icon">📊</text>
			<text class="empty-text">还没有数据</text>
			<text class="empty-tip">添加宠物和记录后查看统计</text>
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
			loadData() {
				this.pets = uni.getStorageSync('pets') || [];
				this.records = uni.getStorageSync('records') || [];

				// 计算本月统计数据
				this.calculateMonthlyStats();
			},

			calculateMonthlyStats() {
				const now = new Date();
				const currentMonth = now.getMonth();
				const currentYear = now.getFullYear();

				// 筛选本月的记录
				const monthRecords = this.records.filter(record => {
					const recordDate = new Date(record.date);
					return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
				});

				// 统计各类型次数
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

				// 初始化计数
				types.forEach(t => typeCounts[t.type] = 0);

				// 统计
				monthRecords.forEach(record => {
					if (typeCounts[record.type] !== undefined) {
						typeCounts[record.type]++;
					}
				});

				// 生成统计数据
				this.monthlyStats = types.map(t => ({
					...t,
					count: typeCounts[t.type]
				})).filter(t => t.count > 0);

				if (this.monthlyStats.length === 0) {
					this.monthlyStats = types.map(t => ({ ...t, count: 0 }));
				}
			}
		}
	}
</script>

<style>
	.container {
		min-height: 100vh;
		background-color: #f8f9fa;
		padding: 30rpx;
	}

	.stats-card {
		background: linear-gradient(135deg, #ffb347, #ff6b6b);
		border-radius: 32rpx;
		padding: 40rpx;
		margin-bottom: 40rpx;
		box-shadow: 0 8rpx 30rpx rgba(255, 107, 107, 0.2);
	}

	.stats-header {
		margin-bottom: 32rpx;
	}

	.stats-title {
		font-size: 32rpx;
		font-weight: 700;
		color: #fff;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 20rpx;
	}

	.stats-item {
		background: rgba(255, 255, 255, 0.2);
		border-radius: 20rpx;
		padding: 24rpx 16rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.stats-icon {
		font-size: 44rpx;
		margin-bottom: 8rpx;
	}

	.stats-count {
		font-size: 36rpx;
		font-weight: 800;
		color: #fff;
		margin-bottom: 4rpx;
	}

	.stats-label {
		font-size: 20rpx;
		color: rgba(255, 255, 255, 0.9);
	}

	.section-title {
		font-size: 32rpx;
		font-weight: 700;
		color: #333;
		margin-bottom: 24rpx;
		padding-left: 16rpx;
		border-left: 6rpx solid #ffb347;
	}

	.pet-stats-list {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}

	.pet-stats-card {
		background-color: #fff;
		border-radius: 24rpx;
		padding: 32rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.05);
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
	}

	.pet-name {
		font-size: 28rpx;
		font-weight: 600;
		color: #333;
	}

	.pet-stats-count {
		text-align: right;
	}

	.count-text {
		font-size: 40rpx;
		font-weight: 800;
		color: #ff6b6b;
	}

	.count-label {
		font-size: 22rpx;
		color: #999;
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
