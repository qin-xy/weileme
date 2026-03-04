<template>
	<view class="container">
		<!-- 空状态：没有宠物 -->
		<view class="empty-pet-state" v-if="pets.length === 0">
			<text class="empty-icon">🐾</text>
			<text class="empty-title">还没有宠物</text>
			<text class="empty-desc">请先添加您的宠物，然后再添加记录</text>
			<button class="add-pet-btn" @tap="goToAddPet">添加宠物</button>
		</view>

		<!-- 正常表单：有宠物 -->
		<view class="form-card" v-else>
			<!-- 宠物选择 -->
			<view class="form-item" v-if="pets.length > 1">
				<view class="label">选择宠物 <text class="required">*</text></view>
				<picker :range="petNames" :value="petIndex" @change="onPetChange" class="picker">
					<view class="picker-input">
						{{petIndex > -1 ? petNames[petIndex] : '请选择宠物'}}
					</view>
				</picker>
			</view>

			<!-- 只有一只宠物时显示 -->
			<view class="form-item pet-display" v-if="pets.length === 1">
				<view class="label">当前宠物</view>
				<view class="selected-pet">
					<image v-if="pets[0].avatar" :src="pets[0].avatar" mode="aspectFill" class="pet-avatar-small"></image>
					<text v-else class="pet-avatar-placeholder">{{getPetIcon(pets[0].type)}}</text>
					<text class="pet-name-display">{{pets[0].name}}</text>
				</view>
			</view>

			<!-- 行为类型 -->
			<view class="form-item">
				<view class="label">行为类型 <text class="required">*</text></view>
				<view class="type-grid">
					<view class="type-item" :class="{active: record.type === item.type}" v-for="item in recordTypes" :key="item.type" @tap="selectType(item)">
						<text class="type-icon">{{item.icon}}</text>
						<text class="type-text">{{item.name}}</text>
					</view>
				</view>
			</view>

			<!-- 日期时间 -->
			<view class="form-item">
				<view class="label">记录时间 <text class="required">*</text></view>
				<picker mode="multiSelector" :range="[dateRange, timeRange]" :value="dateTimeIndex" @change="onDateTimeChange">
					<view class="picker-input">
						{{record.date || '请选择时间'}}
					</view>
				</picker>
			</view>

			<!-- 备注信息 -->
			<view class="form-item">
				<view class="label">备注信息</view>
				<textarea class="textarea" v-model="record.remark" :placeholder="getPlaceholder(record.type)" placeholder-class="placeholder" />
			</view>

			<!-- 图片上传 -->
			<view class="form-item">
				<view class="label">图片（最多3张）</view>
				<view class="image-grid">
					<view class="image-item" v-for="(img, index) in record.images" :key="index">
						<image :src="img" mode="aspectFill" @tap="previewImage(index)"></image>
						<view class="delete-btn" @tap="deleteImage(index)">×</view>
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
						{{record.nextReminder || '不设置提醒'}}
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
		computed: {
			petNames() {
				return this.pets.map(p => p.name);
			}
		},
		async onLoad(options) {
			// 初始化日期时间范围
			this.initDateTimeRange();

			// 加载宠物列表
			await this.loadPets(options);

			// 如果有预选类型
			if (options.type) {
				this.selectType(this.recordTypes.find(t => t.type === options.type));
			}

			// 设置默认时间为当前时间
			const now = new Date();
			this.record.date = this.formatDateTime(now);
		},
		methods: {
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
				// 生成最近7天的日期
				const dates = [];
				const now = new Date();
				for (let i = 0; i < 7; i++) {
					const date = new Date(now);
					date.setDate(date.getDate() - i);
					dates.push(`${date.getMonth() + 1}月${date.getDate()}日`);
				}
				this.dateRange = dates;

				// 生成24小时的时间
				const times = [];
				for (let i = 0; i < 24; i++) {
					for (let j = 0; j < 60; j += 30) {
						times.push(`${i.toString().padStart(2, '0')}:${j.toString().padStart(2, '0')}`);
					}
				}
				this.timeRange = times;
			},

			onPetChange(e) {
				this.petIndex = e.detail.value;
				this.record.petId = this.pets[e.detail.value].id;
			},

			selectType(item) {
				this.record.type = item.type;
				// 特定类型显示提醒设置
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
					'狗狗': '🐕',
					'猫咪': '🐱',
					'鸟类': '🐦',
					'其他': '🐾'
				};
				return icons[type] || '🐾';
			},

			async saveRecord() {
				// 表单验证
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
		background-color: #f8f9fa;
		padding: 30rpx;
		padding-bottom: 120rpx;
	}

	/* 空状态样式 */
	.empty-pet-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 200rpx 40rpx;
	}

	.empty-icon {
		font-size: 120rpx;
		margin-bottom: 24rpx;
		opacity: 0.5;
	}

	.empty-title {
		font-size: 32rpx;
		color: #333;
		font-weight: 700;
		margin-bottom: 12rpx;
	}

	.empty-desc {
		font-size: 26rpx;
		color: #999;
		margin-bottom: 48rpx;
	}

	.add-pet-btn {
		background: linear-gradient(135deg, #ffb347, #ff8c42);
		color: #fff;
		font-weight: bold;
		border-radius: 50rpx;
		font-size: 32rpx;
		padding: 24rpx 64rpx;
		border: none;
		box-shadow: 0 10rpx 25rpx rgba(255, 140, 66, 0.3);
	}

	.form-card {
		background-color: #fff;
		border-radius: 32rpx;
		padding: 40rpx;
		box-shadow: 0 8rpx 30rpx rgba(0,0,0,0.05);
	}

	.form-item {
		margin-bottom: 40rpx;
	}

	.label {
		font-size: 28rpx;
		font-weight: 600;
		color: #444;
		margin-bottom: 16rpx;
	}

	.required {
		color: #ff6b6b;
		margin-left: 4rpx;
	}

	/* 宠物展示样式 */
	.pet-display {
		background-color: #f8f9fa;
		border-radius: 20rpx;
		padding: 24rpx;
	}

	.selected-pet {
		display: flex;
		align-items: center;
	}

	.pet-avatar-small {
		width: 80rpx;
		height: 80rpx;
		border-radius: 50%;
		margin-right: 16rpx;
	}

	.pet-avatar-placeholder {
		font-size: 44rpx;
		margin-right: 16rpx;
	}

	.pet-name-display {
		font-size: 32rpx;
		font-weight: 600;
		color: #333;
	}

	.picker {
		width: 100%;
	}

	.picker-input {
		background-color: #f5f6f7;
		padding: 24rpx 28rpx;
		border-radius: 20rpx;
		font-size: 28rpx;
		color: #333;
		border: 2rpx solid transparent;
	}

	.picker-input.placeholder {
		color: #7a7a7a;
	}

	/* 行为类型选择 */
	.type-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 16rpx;
	}

	.type-item {
		background-color: #f5f6f7;
		border-radius: 20rpx;
		padding: 24rpx 16rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		transition: all 0.3s;
		border: 2rpx solid transparent;
	}

	.type-item.active {
		background: linear-gradient(135deg, #ffb347, #ff8c42);
		border-color: #ffb347;
	}

	.type-icon {
		font-size: 40rpx;
		margin-bottom: 8rpx;
	}

	.type-text {
		font-size: 22rpx;
		color: #666;
	}

	.type-item.active .type-text {
		color: #fff;
		font-weight: 600;
	}

	/* 备注输入 */
	.textarea {
		background-color: #f5f6f7;
		padding: 24rpx 28rpx;
		border-radius: 20rpx;
		font-size: 28rpx;
		width: 100%;
		height: 200rpx;
		color: #333;
		border: 2rpx solid transparent;
		box-sizing: border-box;
	}

	.placeholder {
		color: #7a7a7a;
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
		background-color: #f5f6f7;
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
		background-color: rgba(0,0,0,0.5);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #fff;
		font-size: 32rpx;
		line-height: 1;
	}

	.add-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2rpx dashed #ccc;
	}

	.add-icon {
		font-size: 60rpx;
		color: #999;
	}

	/* 提交按钮 */
	.submit-section {
		margin-top: 40rpx;
	}

	.submit-btn {
		background: linear-gradient(135deg, #ffb347, #ff8c42);
		color: #fff;
		font-weight: bold;
		border-radius: 50rpx;
		font-size: 32rpx;
		border: none;
		box-shadow: 0 10rpx 25rpx rgba(255, 140, 66, 0.3);
	}

	.submit-btn:active {
		opacity: 0.9;
		transform: scale(0.98);
	}
</style>
