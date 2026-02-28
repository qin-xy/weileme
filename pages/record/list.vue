<template>
	<view class="container">
		<!-- 筛选条件 -->
		<view class="filter-section">
			<view class="filter-row">
				<view class="filter-item" @tap="showPetPicker = true">
					<text class="filter-label">宠物</text>
					<text class="filter-value">{{selectedPetName || '全部'}}</text>
				</view>
				<view class="filter-item" @tap="showTypePicker = true">
					<text class="filter-label">类型</text>
					<text class="filter-value">{{selectedTypeName || '全部'}}</text>
				</view>
			</view>
		</view>

		<!-- 记录列表 -->
		<view class="record-list" v-if="filteredRecords.length > 0">
			<view class="record-card" v-for="record in filteredRecords" :key="record.id" @tap="viewRecord(record)">
				<view class="record-header">
					<view class="record-left">
						<text class="record-icon">{{getRecordIcon(record.type)}}</text>
						<view class="record-info">
							<text class="record-type">{{getRecordTypeName(record.type)}}</text>
							<text class="record-pet">{{getPetName(record.petId)}}</text>
						</view>
					</view>
					<text class="record-time">{{formatDateTime(record.date)}}</text>
				</view>
				<view class="record-remark" v-if="record.remark">
					{{record.remark}}
				</view>
				<view class="record-images" v-if="record.images && record.images.length > 0">
					<image v-for="(img, idx) in record.images.slice(0, 3)" :key="idx" :src="img" mode="aspectFill" class="record-image"></image>
				</view>
			</view>
		</view>

		<view class="empty-state" v-else>
			<text class="empty-icon">📝</text>
			<text class="empty-text">还没有记录</text>
			<text class="empty-tip">去添加第一条记录吧</text>
		</view>

		<!-- 宠物选择器 -->
		<view class="picker-modal" v-if="showPetPicker">
			<view class="picker-mask" @tap="showPetPicker = false"></view>
			<view class="picker-content">
				<view class="picker-header">
					<text class="picker-title">选择宠物</text>
					<text class="picker-close" @tap="showPetPicker = false">×</text>
				</view>
				<view class="picker-body">
					<view class="picker-item" :class="{active: selectedPetId === ''}" @tap="selectPet('')">
						<text class="picker-text">全部</text>
					</view>
					<view class="picker-item" v-for="pet in pets" :key="pet.id" :class="{active: selectedPetId === pet.id}" @tap="selectPet(pet.id)">
						<text class="picker-text">{{pet.name}}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 类型选择器 -->
		<view class="picker-modal" v-if="showTypePicker">
			<view class="picker-mask" @tap="showTypePicker = false"></view>
			<view class="picker-content">
				<view class="picker-header">
					<text class="picker-title">选择类型</text>
					<text class="picker-close" @tap="showTypePicker = false">×</text>
				</view>
				<view class="picker-body">
					<view class="picker-item" :class="{active: selectedType === ''}" @tap="selectType('')">
						<text class="picker-text">全部</text>
					</view>
					<view class="picker-item" v-for="item in recordTypes" :key="item.type" :class="{active: selectedType === item.type}" @tap="selectType(item.type)">
						<text class="picker-icon">{{item.icon}}</text>
						<text class="picker-text">{{item.name}}</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				records: [],
				pets: [],
				selectedPetId: '',
				selectedType: '',
				showPetPicker: false,
				showTypePicker: false,
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
		computed: {
			filteredRecords() {
				return this.records.filter(record => {
					if (this.selectedPetId && record.petId !== this.selectedPetId) {
						return false;
					}
					if (this.selectedType && record.type !== this.selectedType) {
						return false;
					}
					return true;
				});
			},
			selectedPetName() {
				if (!this.selectedPetId) return '';
				const pet = this.pets.find(p => p.id === this.selectedPetId);
				return pet ? pet.name : '';
			},
			selectedTypeName() {
				if (!this.selectedType) return '';
				const type = this.recordTypes.find(t => t.type === this.selectedType);
				return type ? type.name : '';
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
				// 加载宠物列表
				this.pets = uni.getStorageSync('pets') || [];

				// 加载记录列表
				const allRecords = uni.getStorageSync('records') || [];
				this.records = allRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
			},

			selectPet(petId) {
				this.selectedPetId = petId;
				this.showPetPicker = false;
			},

			selectType(type) {
				this.selectedType = type;
				this.showTypePicker = false;
			},

			viewRecord(record) {
				uni.showModal({
					title: `${this.getPetName(record.petId)} - ${this.getRecordTypeName(record.type)}`,
					content: record.remark || '无备注',
					showCancel: false
				});
			},

			getPetName(petId) {
				const pet = this.pets.find(p => p.id === petId);
				return pet ? pet.name : '未知';
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

			formatDateTime(dateStr) {
				const date = new Date(dateStr);
				const now = new Date();
				const diffTime = Math.abs(now - date);
				const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

				if (diffDays === 0) {
					return '今天';
				} else if (diffDays === 1) {
					return '昨天';
				} else if (diffDays < 7) {
					return `${diffDays}天前`;
				} else {
					return `${date.getMonth() + 1}/${date.getDate()}`;
				}
			}
		}
	}
</script>

<style>
	.container {
		min-height: 100vh;
		background-color: #f8f9fa;
	}

	/* 筛选区域 */
	.filter-section {
		background-color: #fff;
		padding: 24rpx;
	}

	.filter-row {
		display: flex;
		gap: 16rpx;
	}

	.filter-item {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		background-color: #f5f6f7;
		padding: 20rpx 24rpx;
		border-radius: 16rpx;
	}

	.filter-label {
		font-size: 26rpx;
		color: #666;
	}

	.filter-value {
		font-size: 26rpx;
		color: #333;
		font-weight: 600;
	}

	/* 记录列表 */
	.record-list {
		padding: 24rpx;
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
		justify-content: space-between;
		margin-bottom: 16rpx;
	}

	.record-left {
		display: flex;
		align-items: center;
		flex: 1;
	}

	.record-icon {
		font-size: 44rpx;
		margin-right: 16rpx;
	}

	.record-info {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.record-type {
		font-size: 28rpx;
		font-weight: 700;
		color: #333;
		margin-bottom: 4rpx;
	}

	.record-pet {
		font-size: 24rpx;
		color: #ff6b6b;
	}

	.record-time {
		font-size: 24rpx;
		color: #999;
	}

	.record-remark {
		font-size: 26rpx;
		color: #666;
		line-height: 1.5;
		margin-bottom: 16rpx;
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

	/* 空状态 */
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

	/* 选择器弹窗 */
	.picker-modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 9999;
	}

	.picker-mask {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
	}

	.picker-content {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: #fff;
		border-radius: 32rpx 32rpx 0 0;
		max-height: 60vh;
		overflow: hidden;
	}

	.picker-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 32rpx;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.picker-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}

	.picker-close {
		font-size: 40rpx;
		color: #999;
		width: 60rpx;
		text-align: center;
	}

	.picker-body {
		max-height: 50vh;
		overflow-y: auto;
	}

	.picker-item {
		display: flex;
		align-items: center;
		padding: 28rpx 32rpx;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.picker-item:last-child {
		border-bottom: none;
	}

	.picker-item.active {
		background-color: #fff3e0;
	}

	.picker-icon {
		font-size: 36rpx;
		margin-right: 16rpx;
	}

	.picker-text {
		font-size: 28rpx;
		color: #333;
	}

	.picker-item.active .picker-text {
		color: #ff9800;
		font-weight: 600;
	}
</style>
