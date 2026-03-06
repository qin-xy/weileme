<template>
	<view class="container">
		<!-- 筛选条件 - 胶囊风格 -->
		<view class="filter-area">
			<scroll-view scroll-x class="filter-scroll">
				<view class="filter-row">
					<view class="filter-pill" :class="{active: selectedPetId === ''}" @tap="showPetPicker = true">
						<text>{{selectedPetName || '所有宠物'}}</text>
						<text class="arrow-down">▼</text>
					</view>
					<view class="filter-pill" :class="{active: selectedType === ''}" @tap="showTypePicker = true">
						<text>{{selectedTypeName || '所有记录'}}</text>
						<text class="arrow-down">▼</text>
					</view>
				</view>
			</scroll-view>
		</view>

		<!-- 记录列表 - 时间线风格 -->
		<view class="list-wrapper" v-if="filteredRecords.length > 0">
			<view class="record-item-card" v-for="record in filteredRecords" :key="record.id" @tap="viewRecord(record)">
				<view class="timeline-part">
					<view class="type-icon-circle">{{getRecordIcon(record.type)}}</view>
					<view class="timeline-line"></view>
				</view>
				<view class="content-part">
					<view class="record-top">
						<text class="record-main-type">{{getRecordTypeName(record.type)}}</text>
						<text class="record-timestamp">{{formatDateTime(record.date)}}</text>
					</view>
					<text class="pet-owner-tag">{{getPetName(record.petId)}}</text>
					<view class="remark-box" v-if="record.remark">
						<text class="remark-text">{{record.remark}}</text>
					</view>
					<view class="image-gallery" v-if="record.images && record.images.length > 0">
						<image v-for="(img, idx) in record.images.slice(0, 3)" :key="idx" :src="img" mode="aspectFill" class="gallery-img"></image>
					</view>
				</view>
			</view>
		</view>

		<view class="empty-holder" v-else>
			<text class="empty-icon">📜</text>
			<text class="empty-text">日记本还是空的</text>
			<button class="add-first-btn" @tap="goToAdd">去记一笔</button>
		</view>

		<!-- 底部抽屉选择器 -->
		<view class="drawer-modal" v-if="showPetPicker || showTypePicker">
			<view class="drawer-mask" @tap="closePickers"></view>
			<view class="drawer-body">
				<view class="drawer-handle"></view>
				<view class="drawer-header">
					<text class="drawer-title">{{showPetPicker ? '选择你的宝贝' : '选择记录类型'}}</text>
				</view>
				
				<scroll-view scroll-y class="drawer-list">
					<template v-if="showPetPicker">
						<view class="drawer-item" :class="{selected: selectedPetId === ''}" @tap="selectPet('')">全部宠物</view>
						<view class="drawer-item" v-for="pet in pets" :key="pet.id" :class="{selected: selectedPetId === pet.id}" @tap="selectPet(pet.id)">
							{{pet.name}}
						</view>
					</template>
					<template v-else>
						<view class="drawer-item" :class="{selected: selectedType === ''}" @tap="selectType('')">全部记录</view>
						<view class="drawer-item" v-for="item in recordTypes" :key="item.type" :class="{selected: selectedType === item.type}" @tap="selectType(item.type)">
							<text class="item-icon">{{item.icon}}</text>
							<text>{{item.name}}</text>
						</view>
					</template>
				</scroll-view>
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
				records: [], pets: [], selectedPetId: '', selectedType: '',
				showPetPicker: false, showTypePicker: false,
				recordTypes: [
					{ type: 'feed', name: '喂食', icon: '🍖' }, { type: 'water', name: '饮水', icon: '💧' },
					{ type: 'walk', name: '遛弯', icon: '🚶' }, { type: 'poop', name: '便便', icon: '💩' },
					{ type: 'bath', name: '洗澡', icon: '🛁' }, { type: 'vaccine', name: '疫苗', icon: '💉' },
					{ type: 'medical', name: '就医', icon: '🏥' }, { type: 'weight', name: '体重', icon: '⚖️' }
				]
			}
		},
		computed: {
			filteredRecords() {
				return this.records.filter(r => (!this.selectedPetId || r.petId === this.selectedPetId) && (!this.selectedType || r.type === this.selectedType));
			},
			selectedPetName() { return this.selectedPetId ? (this.pets.find(p => p.id === this.selectedPetId)?.name) : ''; },
			selectedTypeName() { return this.selectedType ? (this.recordTypes.find(t => t.type === this.selectedType)?.name) : ''; }
		},
		onLoad() { this.loadData(); },
		onShow() { this.loadData(); },
		methods: {
			async loadData() {
				const userId = await getUserId();
				const [p, r] = await Promise.all([getPets(userId), getRecords({ userId })]);
				this.pets = p || [];
				this.records = (r || []).sort((a,b) => new Date(b.date) - new Date(a.date));
			},
			selectPet(id) { this.selectedPetId = id; this.closePickers(); },
			selectType(t) { this.selectedType = t; this.closePickers(); },
			closePickers() { this.showPetPicker = false; this.showTypePicker = false; },
			goToAdd() { uni.navigateTo({ url: '/pages/record/add' }); },
			viewRecord(record) {
				const pet = this.pets.find(p => p.id === record.petId);
				uni.showModal({ title: `${pet?.name || '宝贝'} - ${this.getRecordTypeName(record.type)}`, content: record.remark || '这一刻没有写下文字...', showCancel: false });
			},
			getPetName(id) { return this.pets.find(p => p.id === id)?.name || '小可爱'; },
			getRecordIcon(type) {
				const icons = { 'feed': '🍖', 'walk': '🚶', 'bath': '🛁', 'vaccine': '💉', 'medical': '🏥', 'weight': '⚖️' };
				return icons[type] || '📦';
			},
			getRecordTypeName(type) {
				const names = { 'feed': '喂食', 'walk': '遛弯', 'bath': '洗澡', 'vaccine': '疫苗', 'medical': '就教', 'weight': '体重' };
				return names[type] || '其他记录';
			},
			formatDateTime(dateStr) {
				const d = new Date(dateStr);
				const now = new Date();
				if (d.toDateString() === now.toDateString()) return '今天';
				const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
				if (d.toDateString() === yesterday.toDateString()) return '昨天';
				return (d.getMonth() + 1) + '月' + d.getDate() + '日';
			}
		}
	}
</script>

<style>
	.container {
		min-height: 100vh;
		background-color: var(--bg-main);
		padding-top: 20rpx;
	}

	.filter-area {
		padding: 20rpx 40rpx;
		background-color: var(--bg-main);
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.filter-row {
		display: flex;
		gap: 20rpx;
	}

	.filter-pill {
		padding: 16rpx 32rpx;
		background-color: #FFF;
		border-radius: var(--radius-full);
		font-size: 26rpx;
		color: var(--text-main);
		display: flex;
		align-items: center;
		box-shadow: var(--shadow-soft);
	}

	.filter-pill.active { border: 2rpx solid var(--primary); }

	.arrow-down { font-size: 16rpx; margin-left: 10rpx; color: var(--text-muted); }

	.list-wrapper {
		padding: 40rpx;
	}

	.record-item-card {
		display: flex;
		margin-bottom: 40rpx;
	}

	.timeline-part {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-right: 30rpx;
	}

	.type-icon-circle {
		width: 80rpx;
		height: 80rpx;
		background-color: #FFF;
		border-radius: var(--radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 40rpx;
		box-shadow: var(--shadow-soft);
		z-index: 2;
	}

	.timeline-line {
		flex: 1;
		width: 4rpx;
		background-color: var(--border-light);
		margin-top: 10rpx;
	}

	.content-part {
		flex: 1;
		background-color: #FFF;
		border-radius: var(--radius-md);
		padding: 24rpx 32rpx;
		box-shadow: var(--shadow-soft);
	}

	.record-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8rpx;
	}

	.record-main-type { font-size: 30rpx; font-weight: 800; color: var(--text-main); }
	.record-timestamp { font-size: 22rpx; color: var(--text-muted); }

	.pet-owner-tag {
		font-size: 22rpx;
		color: var(--secondary);
		background-color: var(--secondary-light);
		padding: 4rpx 16rpx;
		border-radius: var(--radius-full);
		display: inline-block;
		margin-bottom: 16rpx;
		font-weight: 600;
	}

	.remark-box {
		background-color: var(--bg-main);
		padding: 16rpx;
		border-radius: var(--radius-sm);
		margin-bottom: 16rpx;
	}

	.remark-text { font-size: 26rpx; color: var(--text-muted); line-height: 1.6; }

	.image-gallery {
		display: flex;
		gap: 12rpx;
	}

	.gallery-img { width: 120rpx; height: 120rpx; border-radius: var(--radius-sm); }

	.empty-holder {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding-top: 200rpx;
	}

	.empty-icon { font-size: 120rpx; margin-bottom: 32rpx; opacity: 0.6; }
	.empty-text { font-size: 30rpx; color: var(--text-muted); margin-bottom: 40rpx; }

	.add-first-btn {
		background-color: var(--primary);
		padding: 20rpx 60rpx;
		border-radius: var(--radius-full);
		font-size: 28rpx;
		font-weight: 700;
		border: none;
	}

	/* 抽屉样式 */
	.drawer-modal {
		position: fixed;
		inset: 0;
		z-index: 1000;
	}

	.drawer-mask {
		position: absolute;
		inset: 0;
		background-color: rgba(42, 31, 29, 0.4);
	}

	.drawer-body {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: #FFF;
		border-radius: 60rpx 60rpx 0 0;
		padding: 20rpx 40rpx 80rpx;
		max-height: 70vh;
	}

	.drawer-handle {
		width: 80rpx;
		height: 10rpx;
		background-color: var(--border-light);
		border-radius: 10rpx;
		margin: 0 auto 40rpx;
	}

	.drawer-title { font-size: 36rpx; font-weight: 800; color: var(--text-main); margin-bottom: 40rpx; display: block; }

	.drawer-item {
		padding: 32rpx;
		border-bottom: 2rpx solid var(--bg-main);
		font-size: 30rpx;
		color: var(--text-main);
		display: flex;
		align-items: center;
	}

	.drawer-item.selected { color: var(--secondary); font-weight: 800; background-color: var(--bg-main); border-radius: var(--radius-md); }

	.item-icon { margin-right: 20rpx; font-size: 36rpx; }
</style>
