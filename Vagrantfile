# vim:ft=ruby

Vagrant::Config.run do |config|
  config.vm.box_url = 'http://files.vagrantup.com/precise64.box'
  config.vm.box = "precise64"
  config.vm.host_name = "portia"
  config.vm.forward_port 8000, 8000
  config.vm.network :hostonly, '33.33.33.10'
  config.vm.provision :shell, :path => 'provision.sh'
  config.vm.customize ["modifyvm", :id, "--memory", 512]
end
