<template>
	<view class="container">
		<!-- 空状态：没有宠物 -->
		<view class="empty-pet-state" v-if="pets.length === 0">
			<text class="empty-icon">🐶</text>
			<text class="empty-title">还没有记录对象哦</text>
			<text class="empty-desc">请先添加您的成员，然后再记录它们的美好瞬间</text>
			<button class="primary-btn-pill" @tap="goToAddPet">添加新成员</button>
		</view>

		<!-- 正常表单：有宠物 -->
		<view class="form-wrapper" v-else>
			<view class="page-title">记一笔</view>
			
			<view class="form-card">
				<!-- 宠物选择 - 横向滑动选择 -->
				<view class="form-item">
					<text class="field-label">记录谁？</text>
					<scroll-view scroll-x class="pet-selector">
						<view class="pet-option" v-for="(p, i) in pets" :key="p.id" :class="{selected: record.petId === p.id}" @tap="record.petId = p.id; petIndex = i">
							<image class="pet-mini-avatar" :src="p.avatar || '/static/default-pet.png'" mode="aspectFill"></image>
							<text class="pet-mini-name">{{p.name}}</text>
						</view>
					</scroll-view>
				</view>

				<!-- 行为类型 - 大图标网格 -->
				<view class="form-item">
					<text class="field-label">刚才在做什么？</text>
					<view class="type-grid-modern">
						<view class="type-btn" :class="{active: record.type === item.type}" v-for="item in recordTypes" :key="item.type" @tap="selectType(item)">
							<view class="type-inner">
								<text class="type-icon-text">{{item.icon}}</text>
								<text class="type-name-text">{{item.name}}</text>
							</view>
						</view>
					</view>
				</view>

				<!-- 日期时间 - 胶囊拾取器 -->
				<view class="form-item">
					<text class="field-label">记录时间</text>
					<picker mode="multiSelector" :range="[dateRange, timeRange]" :value="dateTimeIndex" @change="onDateTimeChange">
						<view class="pill-picker-box">
							<text class="picker-val">{{record.date || '现在'}}</text>
							<text class="picker-icon">📅</text>
						</view>
					</picker>
				</view>

				<!-- 备注信息 - 温暖纸质感 -->
				<view class="form-item">
					<text class="field-label">写下此刻 (可选)</text>
					<textarea class="soft-textarea" v-model="record.remark" :placeholder="getPlaceholder(record.type)" placeholder-class="placeholder-style" />
				</view>

				<!-- 图片上传 - 极简网格 -->
				<view class="form-item">
					<text class="field-label">添加照片</text>
					<view class="photo-grid">
						<view class="photo-box" v-for="(img, index) in record.images" :key="index">
							<image :src="img" mode="aspectFill" @tap="previewImage(index)"></image>
							<view class="remove-photo" @tap="deleteImage(index)">×</view>
						</view>
						<view class="photo-add-btn" v-if="record.images.length < 3" @tap="chooseImage">
							<text class="plus">+</text>
						</view>
					</view>
				</view>

				<view class="form-action">
					<button class="cta-save-btn" @tap="saveRecord">保存这一刻</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { getPets, createRecord, createReminder, uploadImage } from '../../utils/api.js';
	import { BASE_URL } from '../../utils/config.js';
	import { getUserId } from '../../utils/user.js';

	export default {
		data() {
			return {
				record: { petId: '', type: '', date: '', remark: '', images: [], nextReminder: '' },
				recordTypes: [
					{ type: 'feed', name: '喂食', icon: '🍖' }, { type: 'water', name: '饮水', icon: '💧' },
					{ type: 'walk', name: '遛弯', icon: '🚶' }, { type: 'poop', name: '便便', icon: '💩' },
					{ type: 'bath', name: '洗澡', icon: '🛁' }, { type: 'vaccine', name: '疫苗', icon: '💉' },
					{ type: 'medical', name: '就教', icon: '🏥' }, { type: 'weight', name: '体重', icon: '⚖️' }
				],
				pets: [], petIndex: -1, dateTimeIndex: [0, 0], dateRange: [], timeRange: [], showReminder: false
			}
		},
		async onLoad(options) {
			this.initDateTimeRange();
			await this.loadPets(options);
			if (options.type) this.selectType(this.recordTypes.find(t => t.type === options.type));
			this.record.date = this.formatDateTime(new Date());
		},
		methods: {
			async loadPets(options) {
				const userId = await getUserId();
				this.pets = await getPets(userId) || [];
				if (options.petId) {
					this.record.petId = options.petId;
					this.petIndex = this.pets.findIndex(p => p.id === options.petId);
				} else if (this.pets.length > 0) {
					this.record.petId = this.pets[0].id;
					this.petIndex = 0;
				}
			},
			initDateTimeRange() {
				const dates = []; const now = new Date();
				for (let i = 0; i < 7; i++) {
					const d = new Date(now); d.setDate(d.getDate() - i);
					dates.push(`${d.getMonth() + 1}月${d.getDate()}日`);
				}
				this.dateRange = dates;
				const times = [];
				for (let i = 0; i < 24; i++) {
					for (let j = 0; j < 60; j += 30) {
						times.push(`${i.toString().padStart(2, '0')}:${j.toString().padStart(2, '0')}`);
					}
				}
				this.timeRange = times;
			},
			selectType(item) { this.record.type = item.type; this.showReminder = ['vaccine', 'medical'].includes(item.type); },
			onDateTimeChange(e) {
				const [di, ti] = e.detail.value;
				this.record.date = `${this.dateRange[di]} ${this.timeRange[ti]}`;
			},
			chooseImage() {
				uni.chooseImage({
					count: 3 - this.record.images.length,
					success: (res) => this.record.images = [...this.record.images, ...res.tempFilePaths]
				});
			},
			deleteImage(idx) { this.record.images.splice(idx, 1); },
			previewImage(idx) { uni.previewImage({ current: idx, urls: this.record.images }); },
			getPlaceholder(type) {
				const p = { 'feed': '喂了什么好吃的？', 'walk': '去了哪里玩耍？', 'weight': '今天重了吗？' };
				return p[type] || '记录一下...';
			},
			formatDateTime(date) {
				return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
			},
			goToAddPet() { uni.navigateTo({ url: '/pages/pet/add' }); },
			async saveRecord() {
				if (!this.record.petId || !this.record.type) { uni.showToast({ title: '还没选全哦', icon: 'none' }); return; }
				try {
					uni.showLoading({ title: '记录中...' });
					const userId = await getUserId();
					const images = await this.uploadImages(this.record.images);
					await createRecord({ userId, ...this.record, images });
					uni.hideLoading();
					uni.showToast({ title: '记好啦！', icon: 'success' });
					setTimeout(() => uni.navigateBack(), 1500);
				} catch (e) { uni.hideLoading(); uni.showToast({ title: '出错了', icon: 'none' }); }
			},
			async uploadImages(images = []) {
				const tasks = images.map(async (path) => {
					if (!path || /^https?:\/\//.test(path)) return path;
					const res = await uploadImage(path);
					return res.url ? `${BASE_URL}${res.url}` : (res.path || path);
				});
				return (await Promise.all(tasks)).filter(i => i);
			}
		}
	}
</script>

<style>
	.container {
		min-height: 100vh;
		background-color: var(--bg-main);
	}

	.empty-pet-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 200rpx 60rpx;
		text-align: center;
	}

	.empty-icon { font-size: 140rpx; margin-bottom: 40rpx; }
	.empty-title { font-size: 36rpx; font-weight: 800; color: var(--text-main); margin-bottom: 20rpx; }
	.empty-desc { font-size: 28rpx; color: var(--text-muted); margin-bottom: 60rpx; line-height: 1.6; }

	.primary-btn-pill {
		background-color: var(--primary);
		padding: 24rpx 80rpx;
		border-radius: var(--radius-full);
		font-size: 32rpx;
		font-weight: 800;
		border: none;
	}

	.form-wrapper {
		padding: 40rpx;
	}

	.page-title { font-size: 52rpx; font-weight: 800; color: var(--text-main); margin-bottom: 40rpx; }

	.form-card {
		background-color: #FFF;
		border-radius: var(--radius-lg);
		padding: 40rpx;
		box-shadow: var(--shadow-soft);
	}

	.form-item { margin-bottom: 48rpx; }

	.field-label { font-size: 28rpx; font-weight: 800; color: var(--text-main); margin-bottom: 24rpx; display: block; }

	.pet-selector { white-space: nowrap; margin: 0 -10rpx; }
	.pet-option {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		margin: 10rpx;
		padding: 16rpx 24rpx;
		background-color: var(--bg-main);
		border-radius: var(--radius-md);
		transition: all 0.3s;
	}
	.pet-option.selected { background-color: var(--secondary-light); border: 2rpx solid var(--secondary); }
	.pet-mini-avatar { width: 80rpx; height: 80rpx; border-radius: var(--radius-full); margin-bottom: 12rpx; }
	.pet-mini-name { font-size: 22rpx; color: var(--text-main); font-weight: 600; }

	.type-grid-modern {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 20rpx;
	}

	.type-btn {
		aspect-ratio: 1;
		background-color: var(--bg-main);
		border-radius: var(--radius-md);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s;
	}

	.type-btn.active { background-color: var(--primary); transform: scale(1.05); }

	.type-inner { display: flex; flex-direction: column; align-items: center; }
	.type-icon-text { font-size: 40rpx; margin-bottom: 8rpx; }
	.type-name-text { font-size: 20rpx; font-weight: 600; color: var(--text-main); }

	.pill-picker-box {
		height: 100rpx;
		background-color: var(--bg-main);
		border-radius: var(--radius-full);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 40rpx;
	}
	.picker-val { font-size: 28rpx; color: var(--text-main); font-weight: 500; }

	.soft-textarea {
		width: 100%;
		height: 200rpx;
		background-color: var(--bg-main);
		border-radius: var(--radius-md);
		padding: 30rpx;
		font-size: 28rpx;
	}

	.photo-grid { display: flex; gap: 20rpx; }
	.photo-box {
		width: 160rpx;
		height: 160rpx;
		position: relative;
	}
	.photo-box image { width: 100%; height: 100%; border-radius: var(--radius-sm); }
	.remove-photo {
		position: absolute;
		top: -10rpx;
		right: -10rpx;
		width: 40rpx;
		height: 40rpx;
		background-color: var(--secondary);
		color: #FFF;
		border-radius: var(--radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 30rpx;
	}
	.photo-add-btn {
		width: 160rpx;
		height: 160rpx;
		background-color: var(--bg-main);
		border-radius: var(--radius-sm);
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2rpx dashed var(--border-light);
	}
	.plus { font-size: 60rpx; color: var(--text-muted); }

	.form-action { margin-top: 60rpx; }
	.cta-save-btn {
		width: 100%;
		height: 110rpx;
		background-color: var(--primary);
		border-radius: var(--radius-full);
		font-size: 32rpx;
		font-weight: 800;
		box-shadow: 0 10rpx 20rpx rgba(255, 182, 41, 0.3);
		border: none;
	}
</style>
