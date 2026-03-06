<template>
	<view class="container">
		<!-- 顶部导航栏 -->
		<view class="nav-header">
			<view class="nav-back" @tap="goBack">
				<text class="back-icon">‹</text>
			</view>
			<text class="nav-title">添加记录</text>
			<view class="nav-placeholder"></view>
		</view>

		<!-- 空状态：没有宠物 -->
		<view class="empty-pet-state" v-if="pets.length === 0">
			<view class="empty-icon-wrap">
				<text class="empty-icon">🐶</text>
			</view>
			<text class="empty-title">还没有宠物</text>
			<text class="empty-desc">请先添加您的宠物，然后再添加记录</text>
			<button class="add-pet-btn" @tap="goToAddPet">添加宠物</button>
		</view>

		<!-- 正常表单：有宠物 -->
		<view class="form-card" v-else>
			<!-- 宠物选择 -->
			<view class="form-item" v-if="pets.length > 1">
				<view class="label">选择宠物 <text class="required">*</text></view>
				<view class="pet-selector">
					<view class="pet-option" 
						  v-for="(pet, index) in pets" 
						  :key="pet.id"
						  :class="{active: petIndex === index}"
						  @tap="selectPet(index)">
						<image v-if="pet.avatar" :src="pet.avatar" mode="aspectFill" class="pet-avatar-small"></image>
						<text v-else class="pet-avatar-placeholder">{{getPetIcon(pet.type)}}</text>
						<text class="pet-name-text">{{pet.name}}</text>
					</view>
				</view>
			</view>

			<!-- 只有一只宠物时显示 -->
			<view class="form-item pet-display" v-if="pets.length === 1">
				<view class="label">当前宠物</view>
				<view class="selected-pet-card">
					<image v-if="pets[0].avatar" :src="pets[0].avatar" mode="aspectFill" class="pet-avatar-small"></image>
					<text v-else class="pet-avatar-placeholder">{{getPetIcon(pets[0].type)}}</text>
					<view class="pet-info">
						<text class="pet-name-text">{{pets[0].name}}</text>
						<text class="pet-type-text">{{getPetTypeText(pets[0].type)}}</text>
					</view>
				</view>
			</view>

			<!-- 行为类型 -->
			<view class="form-item">
				<view class="label">行为类型 <text class="required">*</text></view>
				<view class="type-grid">
					<view class="type-item" 
						  :class="{active: record.type === item.type}" 
						  v-for="item in recordTypes" 
						  :key="item.type" 
						  @tap="selectType(item)">
						<view class="type-icon-wrap">
							<text class="type-icon">{{item.icon}}</text>
						</view>
						<text class="type-text">{{item.name}}</text>
					</view>
				</view>
			</view>

			<!-- 日期时间 -->
			<view class="form-item">
				<view class="label">记录时间 <text class="required">*</text></view>
				<picker mode="multiSelector" :range="[dateRange, timeRange]" :value="dateTimeIndex" @change="onDateTimeChange">
					<view class="picker-input">
						<text class="picker-text">{{record.date || '请选择时间'}}</text>
						<text class="picker-arrow">›</text>
					</view>
				</picker>
			</view>

			<!-- 备注信息 -->
			<view class="form-item">
				<view class="label">备注信息</view>
				<textarea class="textarea" 
						  v-model="record.remark" 
						  :placeholder="getPlaceholder(record.type)" 
						  placeholder-class="placeholder" />
			</view>

			<!-- 图片上传 -->
			<view class="form-item">
				<view class="label">图片（最多3张）</view>
				<view class="image-grid">
					<view class="image-item" v-for="(img, index) in record.images" :key="index">
						<image :src="img" mode="aspectFill" @tap="previewImage(index)"></image>
						<view class="delete-btn" @tap="deleteImage(index)">
							<text class="delete-icon">×</text>
						</view>
					</view>
					<view class="image-item add-btn" v-if="record.images.length < 3" @tap="chooseImage">
						<text class="add-icon">+</text>
					</view>
				</view>
			</view>

			<!-- 提醒设置 -->
			<view class="form-item" v-if="showReminder">
				<view class="label">下次提醒</view>
				<picker mode="date" :value="record.nextReminder" @change="onReminderChange">
					<view class="picker-input" :class="{placeholder: !record.nextReminder}">
						<text class="picker-text">{{record.nextReminder || '不设置提醒'}}</text>
						<text class="picker-arrow">›</text>
					</view>
				</picker>
			</view>

			<!-- 提交按钮 -->
			<view class="submit-section">
				<button class="submit-btn" @tap="saveRecord">保存记录</button>
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
				record: {
					petId: '',
					type: '',
					date: '',
					remark: '',
					images: [],
					nextReminder: ''
				},
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
				],
				pets: [],
				petIndex: -1,
				dateTimeIndex: [0, 0],
				dateRange: [],
				timeRange: [],
				showReminder: false
			}
		},
		async onLoad(options) {
			this.initDateTimeRange();
			await this.loadPets(options);

			if (options.type) {
				this.selectType(this.recordTypes.find(t => t.type === options.type));
			}

			const now = new Date();
			this.record.date = this.formatDateTime(now);
		},
		methods: {
			goBack() {
				uni.navigateBack();
			},

			async loadPets(options) {
				try {
					const userId = await getUserId();
					const pets = await getPets(userId);
					this.pets = pets || [];

					if (options.petId) {
						this.record.petId = options.petId;
						this.petIndex = this.pets.findIndex(p => p.id === options.petId);
					}
				} catch (error) {
					this.pets = [];
					uni.showToast({ title: error.message || '加载宠物失败', icon: 'none' });
				}
			},

			initDateTimeRange() {
				const dates = [];
				const now = new Date();
				for (let i = 0; i < 7; i++) {
					const date = new Date(now);
					date.setDate(date.getDate() - i);
					dates.push(`${date.getMonth() + 1}月${date.getDate()}日`);
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

			selectPet(index) {
				this.petIndex = index;
				this.record.petId = this.pets[index].id;
			},

			selectType(item) {
				this.record.type = item.type;
				this.showReminder = ['vaccine', 'deworm', 'medical'].includes(item.type);
			},

			onDateTimeChange(e) {
				const [dateIndex, timeIndex] = e.detail.value;
				const dateStr = this.dateRange[dateIndex];
				const timeStr = this.timeRange[timeIndex];
				this.record.date = `${dateStr} ${timeStr}`;
			},

			onReminderChange(e) {
				this.record.nextReminder = e.detail.value;
			},

			chooseImage() {
				uni.chooseImage({
					count: 3 - this.record.images.length,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: (res) => {
						this.record.images = [...this.record.images, ...res.tempFilePaths];
					}
				});
			},

			deleteImage(index) {
				this.record.images.splice(index, 1);
			},

			previewImage(index) {
				uni.previewImage({
					current: index,
					urls: this.record.images
				});
			},

			getPlaceholder(type) {
				const placeholders = {
					'feed': '喂了什么？吃了多少？例如：猫粮50g、牛肉、鸡胸肉等',
					'water': '喝了多少水？例如：100ml、半碗等',
					'walk': '遛了多久？去了哪里？发生了什么趣事？',
					'poop': '便便颜色、形状是否正常？',
					'pee': '嘘嘘次数、颜色是否正常？',
					'bath': '用了什么洗浴用品？洗澡时的表现如何？',
					'vaccine': '打了什么疫苗？是否有过敏反应？',
					'deworm': '用了什么驱虫药？体内还是体外？',
					'medical': '什么症状？医生怎么说？需要吃什么药？',
					'play': '玩了什么游戏？心情如何？',
					'train': '训练了什么指令？掌握情况如何？',
					'snack': '吃了什么小零食？表现好才给的吗？',
					'mood': '今天心情怎么样？开心吗？还是闷闷不乐？',
					'sleep': '睡了多久？睡得安稳吗？',
					'weight': '体重多少？有没有长胖点？',
					'other': '记录一些备注信息...'
				};
				return placeholders[type] || '记录一些备注信息...';
			},

			formatDateTime(date) {
				const month = date.getMonth() + 1;
				const day = date.getDate();
				const hours = date.getHours().toString().padStart(2, '0');
				const minutes = date.getMinutes().toString().padStart(2, '0');
				return `${month}月${day}日 ${hours}:${minutes}`;
			},

			goToAddPet() {
				uni.navigateTo({
					url: '/pages/pet/add'
				});
			},

			getPetIcon(type) {
				const icons = {
				'dog': '🐕',
				'cat': '🐱',
				'bird': '🐦',
				'other': '🐶'
			};
			return icons[type] || '🐶';
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

			async saveRecord() {
				if (!this.record.petId) {
					uni.showToast({ title: '请选择宠物', icon: 'none' });
					return;
				}

				if (!this.record.type) {
					uni.showToast({ title: '请选择行为类型', icon: 'none' });
					return;
				}

				if (!this.record.date) {
					uni.showToast({ title: '请选择记录时间', icon: 'none' });
					return;
				}

				try {
					uni.showLoading({ title: '保存中...' });
					const userId = await getUserId();
					const images = await this.uploadImages(this.record.images);

					await createRecord({
						userId,
						petId: this.record.petId,
						type: this.record.type,
						date: this.record.date,
						remark: this.record.remark.trim(),
						images,
						nextReminder: this.record.nextReminder
					});

					if (this.showReminder && this.record.nextReminder) {
						await createReminder({
							userId,
							petId: this.record.petId,
							type: this.record.type,
							title: this.getReminderTitle(this.record.type),
							targetDate: this.record.nextReminder,
							status: 'pending'
						});
					}

					uni.hideLoading();
					uni.showToast({
						title: '保存成功',
						icon: 'success',
						success: () => {
							setTimeout(() => {
								uni.navigateBack();
							}, 1500);
						}
					});
				} catch (error) {
					uni.hideLoading();
					uni.showToast({ title: error.message || '保存失败', icon: 'none' });
				}
			},

			async uploadImages(images = []) {
				const tasks = images.map(async (imagePath) => {
					if (!imagePath) return '';
					if (/^https?:\/\//.test(imagePath)) return imagePath;
					const result = await uploadImage(imagePath);
					if (result.url) return `${BASE_URL}${result.url}`;
					return result.path || imagePath;
				});
				const uploaded = await Promise.all(tasks);
				return uploaded.filter(item => item);
			},

			getReminderTitle(type) {
				const titles = {
					'vaccine': '下次打疫苗',
					'deworm': '下次驱虫',
					'medical': '下次体检'
				};
				return titles[type] || '提醒';
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

	/* 空状态 */
	.empty-pet-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 200rpx 40rpx;
	}

	.empty-icon-wrap {
		width: 160rpx;
		height: 160rpx;
		background: linear-gradient(135deg, #F4E4D6 0%, #E8D5C4 100%);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 32rpx;
	}

	.empty-icon {
		font-size: 80rpx;
	}

	.empty-title {
		font-size: 32rpx;
		color: #3D3229;
		font-weight: 700;
		margin-bottom: 12rpx;
	}

	.empty-desc {
		font-size: 26rpx;
		color: #9B8B7A;
		margin-bottom: 48rpx;
		text-align: center;
	}

	.add-pet-btn {
		background: linear-gradient(135deg, #C4A77D 0%, #A68B5B 100%);
		color: #FFFFFF;
		font-weight: 600;
		border-radius: 50rpx;
		font-size: 32rpx;
		padding: 24rpx 64rpx;
		border: none;
		box-shadow: 0 8rpx 24rpx rgba(196, 167, 125, 0.35);
	}

	/* 表单卡片 */
	.form-card {
		background: #FFFFFF;
		border-radius: 36rpx 36rpx 0 0;
		padding: 40rpx 32rpx;
		margin-top: -20rpx;
		min-height: calc(100vh - 188rpx);
	}

	.form-item {
		margin-bottom: 40rpx;
	}

	.label {
		font-size: 28rpx;
		font-weight: 600;
		color: #3D3229;
		margin-bottom: 16rpx;
	}

	.required {
		color: #C4786E;
		margin-left: 4rpx;
	}

	/* 宠物选择器 */
	.pet-selector {
		display: flex;
		gap: 16rpx;
		overflow-x: auto;
		padding-bottom: 8rpx;
	}

	.pet-option {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		background: #F5F0E8;
		border-radius: 20rpx;
		padding: 20rpx 24rpx;
		min-width: 140rpx;
		transition: all 0.2s ease;
		border: 2rpx solid transparent;
	}

	.pet-option.active {
		background: linear-gradient(135deg, #C4A77D 0%, #A68B5B 100%);
		border-color: #C4A77D;
	}

	.pet-avatar-small {
		width: 72rpx;
		height: 72rpx;
		border-radius: 50%;
		margin-bottom: 12rpx;
	}

	.pet-avatar-placeholder {
		width: 72rpx;
		height: 72rpx;
		border-radius: 50%;
		background: linear-gradient(135deg, #F4E4D6 0%, #E8D5C4 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 40rpx;
		margin-bottom: 12rpx;
	}

	.pet-name-text {
		font-size: 24rpx;
		color: #6B5D4D;
		font-weight: 500;
	}

	.pet-option.active .pet-name-text {
		color: #FFFFFF;
	}

	/* 当前宠物展示 */
	.pet-display {
		background: #F5F0E8;
		border-radius: 20rpx;
		padding: 24rpx;
	}

	.selected-pet-card {
		display: flex;
		align-items: center;
		background: #FFFFFF;
		border-radius: 16rpx;
		padding: 20rpx;
	}

	.pet-info {
		margin-left: 20rpx;
	}

	.pet-type-text {
		font-size: 22rpx;
		color: #9B8B7A;
		margin-top: 4rpx;
	}

	/* 行为类型选择 */
	.type-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 16rpx;
	}

	.type-item {
		background: #F5F0E8;
		border-radius: 20rpx;
		padding: 24rpx 12rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		transition: all 0.2s ease;
		border: 2rpx solid transparent;
	}

	.type-item.active {
		background: linear-gradient(135deg, #C4A77D 0%, #A68B5B 100%);
		border-color: #C4A77D;
	}

	.type-icon-wrap {
		width: 64rpx;
		height: 64rpx;
		background: #FFFFFF;
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 12rpx;
	}

	.type-item.active .type-icon-wrap {
		background: rgba(255, 255, 255, 0.2);
	}

	.type-icon {
		font-size: 36rpx;
	}

	.type-text {
		font-size: 22rpx;
		color: #6B5D4D;
		font-weight: 500;
	}

	.type-item.active .type-text {
		color: #FFFFFF;
	}

	/* 选择器 */
	.picker-input {
		background: #F5F0E8;
		padding: 24rpx 28rpx;
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.picker-text {
		font-size: 28rpx;
		color: #3D3229;
	}

	.picker-input.placeholder .picker-text {
		color: #B8A99A;
	}

	.picker-arrow {
		font-size: 32rpx;
		color: #B8A99A;
	}

	/* 备注输入 */
	.textarea {
		background: #F5F0E8;
		padding: 24rpx 28rpx;
		border-radius: 16rpx;
		font-size: 28rpx;
		width: 100%;
		height: 200rpx;
		color: #3D3229;
		box-sizing: border-box;
	}

	.placeholder {
		color: #B8A99A;
	}

	/* 图片上传 */
	.image-grid {
		display: flex;
		gap: 16rpx;
		flex-wrap: wrap;
	}

	.image-item {
		width: 180rpx;
		height: 180rpx;
		border-radius: 16rpx;
		overflow: hidden;
		position: relative;
		background: #F5F0E8;
	}

	.image-item image {
		width: 100%;
		height: 100%;
	}

	.delete-btn {
		position: absolute;
		top: 8rpx;
		right: 8rpx;
		width: 44rpx;
		height: 44rpx;
		background: rgba(61, 50, 41, 0.6);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.delete-icon {
		color: #FFFFFF;
		font-size: 28rpx;
		font-weight: 300;
	}

	.add-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2rpx dashed #D4C8B8;
		background: transparent;
	}

	.add-icon {
		font-size: 56rpx;
		color: #B8A99A;
		font-weight: 300;
	}

	/* 提交按钮 */
	.submit-section {
		margin-top: 48rpx;
		padding-bottom: 48rpx;
	}

	.submit-btn {
		background: linear-gradient(135deg, #C4A77D 0%, #A68B5B 100%);
		color: #FFFFFF;
		font-weight: 600;
		border-radius: 50rpx;
		font-size: 32rpx;
		border: none;
		box-shadow: 0 8rpx 24rpx rgba(196, 167, 125, 0.35);
		height: 96rpx;
		line-height: 96rpx;
	}

	.submit-btn:active {
		opacity: 0.95;
		transform: scale(0.98);
	}
</style>
