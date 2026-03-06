<template>
	<view class="container">
		<!-- 顶部导航栏 -->
		<view class="nav-header">
			<view class="nav-back" @tap="goBack">
				<text class="back-icon">‹</text>
			</view>
			<text class="nav-title">记录列表</text>
			<view class="nav-placeholder"></view>
		</view>

		<!-- 筛选条件 -->
		<view class="filter-section">
			<view class="filter-row">
				<view class="filter-item" @tap="showPetPicker = true">
					<text class="filter-label">宠物</text>
					<view class="filter-value-wrap">
						<text class="filter-value">{{selectedPetName || '全部'}}</text>
						<text class="filter-arrow">›</text>
					</view>
				</view>
				<view class="filter-item" @tap="showTypePicker = true">
					<text class="filter-label">类型</text>
					<view class="filter-value-wrap">
						<text class="filter-value">{{selectedTypeName || '全部'}}</text>
						<text class="filter-arrow">›</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 记录列表 -->
		<view class="record-list" v-if="filteredRecords.length > 0">
			<view class="record-card" v-for="record in filteredRecords" :key="record.id" @tap="viewRecord(record)">
				<view class="record-header">
					<view class="record-left">
						<view class="record-icon-wrap">
							<text class="record-icon">{{getRecordIcon(record.type)}}</text>
						</view>
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

		<view class="empty-state-custom" v-else>
			<view class="empty-icon-wrap">
				<text class="empty-icon">📝</text>
			</view>
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
	import { getPets, getRecords } from '../../utils/api.js';
	import { getUserId } from '../../utils/user.js';

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
			goBack() {
				uni.navigateBack();
			},

			async loadData() {
				try {
					const userId = await getUserId();
					const [pets, records] = await Promise.all([
						getPets(userId),
						getRecords({ userId })
					]);
					this.pets = pets || [];
					this.records = (records || []).sort((a, b) => this.parseRecordDate(b.date) - this.parseRecordDate(a.date));
				} catch (error) {
					this.pets = [];
					this.records = [];
					uni.showToast({ title: error.message || '加载失败', icon: 'none' });
				}
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

	/* 筛选区域 */
	.filter-section {
		background: #FFFFFF;
		padding: 24rpx 32rpx;
		margin: -20rpx 32rpx 0;
		border-radius: 20rpx;
		box-shadow: 0 4rpx 16rpx rgba(61, 50, 41, 0.06);
		position: relative;
		z-index: 1;
	}

	.filter-row {
		display: flex;
		gap: 20rpx;
	}

	.filter-item {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: #F5F0E8;
		padding: 20rpx 24rpx;
		border-radius: 16rpx;
	}

	.filter-label {
		font-size: 24rpx;
		color: #9B8B7A;
	}

	.filter-value-wrap {
		display: flex;
		align-items: center;
		gap: 8rpx;
	}

	.filter-value {
		font-size: 26rpx;
		color: #3D3229;
		font-weight: 600;
	}

	.filter-arrow {
		font-size: 28rpx;
		color: #B8A99A;
	}

	/* 记录列表 */
	.record-list {
		padding: 24rpx 32rpx;
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

	.record-icon-wrap {
		width: 64rpx;
		height: 64rpx;
		background: linear-gradient(135deg, #F4E4D6 0%, #E8D5C4 100%);
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 16rpx;
	}

	.record-icon {
		font-size: 32rpx;
	}

	.record-info {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.record-type {
		font-size: 28rpx;
		font-weight: 700;
		color: #3D3229;
		margin-bottom: 4rpx;
	}

	.record-pet {
		font-size: 22rpx;
		color: #C4A77D;
	}

	.record-time {
		font-size: 22rpx;
		color: #9B8B7A;
	}

	.record-remark {
		font-size: 26rpx;
		color: #6B5D4D;
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
		border-radius: 12rpx;
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
		background-color: rgba(61, 50, 41, 0.5);
	}

	.picker-content {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: #FFFFFF;
		border-radius: 36rpx 36rpx 0 0;
		max-height: 60vh;
		overflow: hidden;
	}

	.picker-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 32rpx;
		border-bottom: 2rpx solid #F0EBE3;
	}

	.picker-title {
		font-size: 32rpx;
		font-weight: 700;
		color: #3D3229;
	}

	.picker-close {
		font-size: 40rpx;
		color: #9B8B7A;
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
		border-bottom: 2rpx solid #F0EBE3;
	}

	.picker-item:last-child {
		border-bottom: none;
	}

	.picker-item.active {
		background-color: #F4E4D6;
	}

	.picker-icon {
		font-size: 36rpx;
		margin-right: 16rpx;
	}

	.picker-text {
		font-size: 28rpx;
		color: #3D3229;
	}

	.picker-item.active .picker-text {
		color: #C4A77D;
		font-weight: 600;
	}
</style>
