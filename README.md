# @sagacious/cli

![logo](https://sagacious-1300640815.cos.ap-beijing.myqcloud.com/Donkey_128px_1082061_easyicon.net.ico)

**🐎 a universal template management tool**

## Install

`npm install -g @sagacious/cli`

or if you prefer yarn

`yarn global add @sagacious/cli`

## Usage

### **now you can see the `sag` command globally like this**

![help](https://sagacious-1300640815.cos.ap-beijing.myqcloud.com/help.gif)

### **📦 first: add template**

template can be an npm package

![addNpm](https://sagacious-1300640815.cos.ap-beijing.myqcloud.com/addNpm.gif)

template can be a git repository

![addGit](https://sagacious-1300640815.cos.ap-beijing.myqcloud.com/addGit.gif)

template can be a local folder

![addDir](https://sagacious-1300640815.cos.ap-beijing.myqcloud.com/addDir.gif)

and then you can check it

![check](https://sagacious-1300640815.cos.ap-beijing.myqcloud.com/check.gif)

you can even manage different versions of templates

![addMoreVersion](https://sagacious-1300640815.cos.ap-beijing.myqcloud.com/addMoreVersion.gif)

you can delete templates when you don't need them

![remove](https://sagacious-1300640815.cos.ap-beijing.myqcloud.com/remove.gif)

### **😜 second: create app**

 now you can initialize your template where you need it

![createApp](https://sagacious-1300640815.cos.ap-beijing.myqcloud.com/createApp.gif)

## FAQ

### why do we need template management tools?

we all know that there are mature types of scaffolding in the community, but every time you initialize a project, you still need to customize a lot of personalized content. The template management tool can uniformly manage and cache your various templates.

### why @sagacious/cli and not yo?

yoman is a great tool, but I don't really like the mandatory naming prefix of his templates. Then in most cases, we may need to add a git repository template or a local template instead of publishing a new version of the npm package every time.

### why a donkey appeared?

🐴 this donkey is a sagacious mascot~

## Related

- [@sagacious/template-vue](https://www.npmjs.com/package/@sagacious/template-vue)  - a universal customized vue project template.
- more...